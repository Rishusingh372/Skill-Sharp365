const express = require('express');
const Course = require('../models/Course');
const { protect, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try { const courses = await Course.find().populate('instructor','name'); res.json(courses); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { const c = await Course.findById(req.params.id).populate('instructor','name email'); if(!c) return res.status(404).json({message:'Not found'}); res.json(c);} catch(e){next(e);}
});

router.post('/', protect, authorizeRoles('instructor','admin'), async (req, res, next) => {
  try { const course = await Course.create({ ...req.body, instructor: req.user._id }); res.status(201).json(course); } catch (e) { next(e); }
});

router.put('/:id', protect, authorizeRoles('instructor','admin'), async (req, res, next) => {
  try { const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(course); } catch (e) { next(e); }
});

router.delete('/:id', protect, authorizeRoles('admin'), async (req, res, next) => {
  try { await Course.findByIdAndDelete(req.params.id); res.json({message:'deleted'}); } catch(e){next(e);}
});

module.exports = router;
