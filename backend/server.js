require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const uploadRoutes = require('./routes/upload');
const discussionRoutes = require('./routes/discussionRoutes');
const paymentRoutes = require('./routes/payment');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket.io simple handling
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('joinRoom', ({room}) => socket.join(room));
  socket.on('chatMessage', ({room, message, user}) => {
    io.to(room).emit('chatMessage', { message, user, createdAt: new Date() });
  });
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// connect db
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/lmsdb';
mongoose.connect(MONGO).then(()=>console.log('MongoDB connected')).catch(e=>console.error(e));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
