const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/:courseId', protect, upload.single('file'), (req, res) => {
  res.json({ success: true, filePath: `/uploads/${req.file.filename}`, originalname: req.file.originalname });
});

module.exports = router;
