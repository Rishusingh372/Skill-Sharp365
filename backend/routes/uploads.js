import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    let cld_upload_stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
      if (error) return res.status(500).json({ message: error.message });
      res.json({ url: result.secure_url, public_id: result.public_id });
    });
    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
