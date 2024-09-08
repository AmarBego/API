const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = process.env.PORT || 3000;

// Add CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL_PORTFOLIO.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));

app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('test');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// API Key middleware
const apiAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const apiKey = new URL(req.url, 'http://localhost').searchParams.get('apiKey');
  if (apiKey !== process.env.API_KEY) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  console.log('New WebSocket client connected');
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast function to send updates to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Users endpoint (excluding password)
app.post('/api/users', apiAuth, async (req, res) => {
  try {
    const newUser = await db.collection('users').insertOne(req.body);
    const user = await db.collection('users').findOne({ _id: newUser.insertedId }, { projection: { password: 0 } });
    broadcast({ type: 'newUser', user });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Transactions endpoint
app.post('/api/transactions', apiAuth, async (req, res) => {
  try {
    const newTransaction = await db.collection('transactions').insertOne(req.body);
    const transaction = await db.collection('transactions').findOne({ _id: newTransaction.insertedId });
    broadcast({ type: 'newTransaction', transaction });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

app.post('/api/broadcast', apiAuth, (req, res) => {
  broadcast(req.body);
  console.log('Broadcast sent to all clients');
  res.status(200).json({ message: 'Broadcast sent' });
});

// Update user
app.put('/api/users/:id', apiAuth, async (req, res) => {
  try {
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after', projection: { password: 0 } }
    );
    if (result.value) {
      broadcast({ type: 'updateUser', user: result.value });
      res.json(result.value);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Users endpoint (excluding password)
app.get('/api/users', apiAuth, async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Single user endpoint (excluding password)
app.get('/api/users/:id', apiAuth, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Transactions for a specific user
app.get('/api/users/:id/transactions', apiAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    let query;

    if (ObjectId.isValid(userId)) {
      query = { userId: { $in: [userId, new ObjectId(userId)] } };
    } else {
      query = { userId: userId };
    }

    const transactions = await db.collection('transactions')
      .find(query)
      .toArray();
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Error fetching user transactions' });
  }
});

async function startServer() {
  await connectToDatabase();
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer().catch(console.error);