const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('CampusFeed backend is running!');
});

const PORT = process.env.PORT || 5000;

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
 .then(() => console.log('Mongodb connected'))
 .catch((err) => console.log('MongodB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});