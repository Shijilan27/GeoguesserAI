import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import logRoutes from './routes/logRoutes';
import config from './config'; // Import config from the new file

const app = express();
const PORT = config.PORT || 3001;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Serve uploaded files statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/logs', logRoutes);

// MongoDB Connection
const mongoUri = config.MONGO_URI;
if (!mongoUri || mongoUri === "PASTE_YOUR_MONGODB_CONNECTION_STRING_HERE") {
  console.error('FATAL ERROR: MONGO_URI is not configured. Please paste your connection string in the `config.ts` file.');
  (process as any).exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    // Start the server only after a successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    (process as any).exit(1);
  });

// Basic error handling for unhandled routes
app.use((req: Request, res: Response) => {
    res.status(404).send("API route not found.");
});