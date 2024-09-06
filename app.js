const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Add CORS middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL_PORTFOLIO],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Transactions endpoint
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await client.db('test').collection('transactions').find().toArray();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Users endpoint (excluding password)
app.get('/api/users', async (req, res) => {
  try {
    const users = await client.db('test').collection('users').find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Single user endpoint (excluding password)
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await client.db('test').collection('users').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// New endpoint: Transactions for a specific user
app.get('/api/users/:id/transactions', async (req, res) => {
    try {
      const userId = req.params.id;
      let query;
  
      // Check if the userId is a valid ObjectId
      if (ObjectId.isValid(userId)) {
        query = { userId: { $in: [userId, new ObjectId(userId)] } };
      } else {
        query = { userId: userId };
      }
  
      const transactions = await client.db('test').collection('transactions')
        .find(query)
        .toArray();
      
      if (transactions.length > 0) {
        res.json(transactions);
      } else {
        res.status(404).json({ message: 'No transactions found for this user' });
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ error: 'Error fetching user transactions' });
    }
  });

app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server running at http://localhost:${port}`);
});