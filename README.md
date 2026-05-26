# Byte Bets 

Byte Bets is a high-end, provably fair cryptographic casino platform. It brings a premium, professional UI to Web3 betting, featuring a suite of classic games powered by Next.js, Web3Modal, and smart contracts.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **Web3**: Wagmi, Viem, Web3Modal
- **Graphics**: React Three Fiber (Three.js)

### Backend (Game Server)
- **Runtime**: Node.js + Express
- **Realtime**: Socket.IO
- **Database**: SQLite (via Prisma ORM)
- **Validation**: Zod

### Smart Contracts
- **Environment**: Hardhat
- **Language**: Solidity

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Linting**: ESLint, Prettier

---

## Architecture Overview

The repository is structured as a monorepo with distinct functional boundaries:

```text
byte-bets/
├── frontend/       # Next.js UI, wagmi hooks, and 3D scenes
├── game-server/    # Node.js Express server handling game logic and websockets
├── contracts/      # Solidity smart contracts and Hardhat deployment scripts
├── docs/           # Detailed architectural and API documentation
└── docker-compose.yml
```

For more details, see the [Architecture Documentation](./docs/architecture.md).

---

## Setup Instructions

### Prerequisites
- Node.js (v20+)
- Docker & Docker Compose
- MetaMask (or another Web3 Wallet)

### Local Development (via Docker)

The easiest way to run the entire stack locally is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/byte-bets.git
cd byte-bets

# Copy environment variables
cp frontend/.env.example frontend/.env
cp game-server/.env.example game-server/.env

# Spin up the containers
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Game Server**: http://localhost:8080

### Local Development (Manual)

If you prefer running services directly on your host machine:

#### 1. Smart Contracts
```bash
cd contracts
npm install
npx hardhat node
```

#### 2. Game Server
```bash
cd game-server
npm install
npx prisma db push
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Management

Never commit production secrets! Use `.env` files locally. Check the respective `.env.example` files in both the `frontend` and `game-server` directories.

## License

MIT License. See `LICENSE` for details.
