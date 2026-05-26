# Deployment Guide

Byte Bets is designed to be easily deployable using standard containerization tools.

## Production Setup with Docker Compose

A `docker-compose.yml` file is provided at the root of the project to orchestrate the Frontend and Game Server.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/byte-bets.git
    cd byte-bets
    ```

2.  **Configure Environment Variables**
    Copy the example environment files and update them with your production keys.
    ```bash
    cp frontend/.env.example frontend/.env
    cp game-server/.env.example game-server/.env
    ```
    *Ensure `DATABASE_URL` in the game-server points to a persistent volume or external PostgreSQL database in production.*

3.  **Build and Run**
    ```bash
    docker-compose up -d --build
    ```

## Deploying Smart Contracts

The smart contracts must be deployed to an Ethereum-compatible network (e.g., Sepolia Testnet or Mainnet) before the frontend can fully interact with them.

1.  Navigate to the `contracts` directory:
    ```bash
    cd contracts
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Deploy using Hardhat Ignition (replace `network-name` with your target network):
    ```bash
    npx hardhat ignition deploy ./ignition/modules/ByteBets.ts --network network-name
    ```

## CI/CD Pipeline

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically runs linting, tests, and build checks on every push and pull request to the `main` branch. This ensures that no broken code is merged.
