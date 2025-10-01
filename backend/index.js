const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const courseRoutes = require('./routes/courseRoutes');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes); // Add this line
app.use('/api/test', testRoutes); // Your test routes from Day 3


// port listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});