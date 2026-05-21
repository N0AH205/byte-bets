// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CryptoDice is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface COORDINATOR;

    // Chainlink VRF Subscription Variables
    uint64 s_subscriptionId;
    bytes32 s_keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // Struct to store a user's bet while we wait for the random number
    struct Bet {
        address payable player;
        uint256 amount;
        uint8 rollUnder;
    }

    // Map the Chainlink Request ID to the Bet
    mapping(uint256 => Bet) public activeBets;

    // Events for the frontend to listen to
    event BetPlaced(uint256 indexed requestId, address player, uint256 amount, uint8 rollUnder);
    event DiceRolled(uint256 indexed requestId, address player, uint256 result, uint256 payout);

    constructor(
        uint64 subscriptionId, 
        address vrfCoordinator, 
        bytes32 keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
    }

    // 1. User calls this function from the frontend to play
    function rollDice(uint8 _rollUnder) external payable returns (uint256 requestId) {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(_rollUnder > 1 && _rollUnder < 99, "Invalid roll target");
        
        // --- NEW: BANKROLL PROTECTION LOGIC ---
        // Calculate the maximum allowed bet (1% of total contract balance)
        // We calculate this BEFORE taking the user's bet into account
        uint256 currentBalance = address(this).balance - msg.value;
        uint256 maxAllowedBet = currentBalance / 100; 
        
        require(msg.value <= maxAllowedBet, "Bet exceeds maximum table limit (1% of bankroll)");
        // --------------------------------------

        // Ensure the contract has enough balance to pay out a win based on the 2% edge
        uint256 winChance = _rollUnder - 1;
        uint256 maxPossiblePayout = (msg.value * 98) / winChance;
        require(address(this).balance >= maxPossiblePayout, "House bank is too low for this payout");

        // Request the random number from Chainlink
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        // Store the bet details
        activeBets[requestId] = Bet({
            player: payable(msg.sender),
            amount: msg.value,
            rollUnder: _rollUnder
        });

        emit BetPlaced(requestId, msg.sender, msg.value, _rollUnder);
        return requestId;
    }

    // 2. Chainlink automatically calls this function a few seconds later with the random number
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        Bet memory bet = activeBets[_requestId];
        require(bet.amount > 0, "Bet not found");

        // Transform the massive random number into a dice roll between 1 and 100
        uint256 result = (_randomWords[0] % 100) + 1;
        uint256 payout = 0;

        // Check if the player won
        if (result < bet.rollUnder) {
            uint256 winChance = bet.rollUnder - 1;
            // Calculate the exact payout with a 2% house edge locked in
            payout = (bet.amount * 98) / winChance;
            
            // Send the winnings to the player
            (bool success, ) = bet.player.call{value: payout}("");
            require(success, "Payout transfer failed");
        }

        // Clean up the storage to save gas
        delete activeBets[_requestId];

        emit DiceRolled(_requestId, bet.player, result, payout);
    }

    // Allow the owner to fund the house bank
    function fundBank() external payable {}
}