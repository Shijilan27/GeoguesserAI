import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Log from '../models/Log';

const router = Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Helper to fill missing guess fields
function fillGuessFields(guess: any) {
  return {
    country: guess?.country || 'No data',
    countryCode: guess?.countryCode || 'No data',
    state: guess?.state || 'No data',
    city: guess?.city || 'No data',
    direction: guess?.direction || 'No data',
    nearestCity: guess?.nearestCity || 'No data',
    reasoning: guess?.reasoning || 'No data',
    confidence: guess?.confidence || 'No data',
    accuracyRadiusKm: guess?.accuracyRadiusKm ?? -1,
  };
}

// POST /api/logs - Create a new log entry
// This route expects multipart/form-data with an 'image' file and 'logData' text field
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }
    if (!req.body.logData) {
        return res.status(400).json({ message: 'Log data is required.' });
    }

    const logData = JSON.parse(req.body.logData);
    
    const newLog = new Log({
      ...logData,
      guess: fillGuessFields(logData.guess || {}),
      imageName: req.file.originalname,
      imagePath: req.file.path, // Save the path to the file
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error creating log entry:', error);
    res.status(500).json({ message: 'Server error while creating log entry.', error });
  }
});

// PATCH /api/logs/:id - Update an existing log entry
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedLog = await Log.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedLog) {
      return res.status(404).json({ message: 'Log entry not found.' });
    }

    res.status(200).json(updatedLog);
  } catch (error) {
    console.error('Error updating log entry:', error);
    res.status(500).json({ message: 'Server error while updating log entry.', error });
  }
});

// GET /api/logs - Get all log entries
router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error while fetching logs.', error });
  }
});

// DELETE /api/logs - Delete all log entries
router.delete('/', async (req: Request, res: Response) => {
  try {
    await Log.deleteMany({});
    res.status(200).json({ message: 'All logs deleted successfully.' });
  } catch (error) {
    console.error('Error deleting all logs:', error);
    res.status(500).json({ message: 'Server error while deleting all logs.', error });
  }
});

export default router;