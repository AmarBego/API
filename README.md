# Real-time Transaction API

This is a Node.js Express server that provides a real-time API for managing users and transactions. It uses MongoDB for data storage and WebSocket for real-time updates.

## Features

- User management (create, update, get)
- Transaction management (create, get)
- Real-time updates via WebSocket
- API key authentication
- CORS support

## Prerequisites

- Node.js
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   FRONTEND_URL_PORTFOLIO=http://localhost:3000,http://localhost:5173
   API_KEY=your_secret_api_key
   ```

## Usage

Start the server:
```
npm start
```

The server will start on the specified port (default: 3000).

## API Endpoints

All endpoints require the `X-API-Key` header for authentication.

### Users

- `POST /api/users`: Create a new user
- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get a single user
- `PUT /api/users/:id`: Update a user

### Transactions

- `POST /api/transactions`: Create a new transaction
- `GET /api/users/:id/transactions`: Get transactions for a specific user

### Broadcast

- `POST /api/broadcast`: Send a broadcast message to all connected WebSocket clients

## WebSocket

Connect to the WebSocket server at `ws://localhost:3000` with the API key as a query parameter:
