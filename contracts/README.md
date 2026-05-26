# Byte Bets Smart Contracts

This directory contains the Solidity smart contracts that power the provable fairness of Byte Bets.

## Tech Stack
- **Framework**: Hardhat
- **Language**: Solidity (^0.8.24)
- **Tooling**: Ignition (for declarative deployments)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Run local node:
```bash
npx hardhat node
```

## Testing
Run the comprehensive test suite:
```bash
npx hardhat test
```

## Deployment
Deploy to a local or test network using Hardhat Ignition:
```bash
npx hardhat ignition deploy ./ignition/modules/ByteBets.ts --network localhost
```
*Note: Ensure you have your `PRIVATE_KEY` and RPC URLs configured in your `.env` file before deploying to live networks.*
