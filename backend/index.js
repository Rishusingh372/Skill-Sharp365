const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const courseRoutes = require('./routes/courseRoutes');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Mount routes
app.use('/api/auth', authRoutes); // auth routes
app.use('/api/courses', courseRoutes); // course routes
app.use('/api/test', testRoutes); // test routes
app.use('/api/upload', uploadRoutes); // upload routes
app.use('/api/payment', paymentRoutes); // pyment routes
app.use('/api/admin', adminRoutes); // routes for admin


// port listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});