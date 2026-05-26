# API Documentation

The Game Server provides both RESTful endpoints and WebSocket events.

## REST API (Express)

All REST endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /api/v1/auth/verify`
  - Verifies a cryptographic signature from a Web3 wallet and returns a session token.

### User
- `GET /api/v1/user/profile`
  - Returns the authenticated user's profile and off-chain balance.

## WebSocket API (Socket.IO)

The WebSocket connection is established at the root path `/` and requires an authentication token during the handshake.

### Client-to-Server Events
- `placeBet`
  - Payload: `{ game: string, amount: number, prediction: any }`
  - Description: Places a bet on a specific game.

### Server-to-Client Events
- `betResult`
  - Payload: `{ id: string, won: boolean, payout: number, multiplier: number }`
  - Description: Emitted when a game round concludes and the bet is settled.
- `crashUpdate`
  - Payload: `{ multiplier: number, status: 'running' | 'crashed' }`
  - Description: Emitted every tick (50ms) during an active Crash game.
