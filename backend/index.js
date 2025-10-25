const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const courseRoutes = require('./routes/courseRoutes');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const cors = require('cors');

const app = express();

// Middleware for Stripe webhook raw body
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://skill-sharp365.vercel.app'
  ],
  credentials: true
}));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Mount routes
app.use('/api/auth', authRoutes); // auth routes
app.use('/api/courses', courseRoutes); // course routes
app.use('/api/test', testRoutes); // test routes
app.use('/api/upload', uploadRoutes); // upload routes
app.use('/api/payment', paymentRoutes); // payment routes
app.use('/api/admin', adminRoutes); // routes for admin
app.use('/api/webhook', webhookRoutes); // webhook routes


// port listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});