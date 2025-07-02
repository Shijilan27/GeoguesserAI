import { Schema, model, Document } from 'mongoose';

// Interface for the 'guess' object, mirroring the frontend type
interface ILocationGuess {
  country: string;
  countryCode: string;
  state: string;
  city: string;
  direction: string;
  nearestCity: string;
  reasoning: string;
  confidence: 'High' | 'Medium' | 'Low' | 'No data';
  accuracyRadiusKm: number;
}

// Interface for the Log document
export interface ILog extends Document {
  userName: string;
  imageName: string;
  imagePath: string; // Path to the stored image on the server
  guess: ILocationGuess;
  feedback: 'correct' | 'incorrect' | 'not provided';
  correctedCountry?: string;
  correctedState?: string;
  correctedCity?: string;
  timestamp: Date;
}

const LocationGuessSchema = new Schema<ILocationGuess>({
    country: { type: String, required: true, default: 'No data' },
    countryCode: { type: String, required: true, default: 'No data' },
    state: { type: String, required: true, default: 'No data' },
    city: { type: String, required: true, default: 'No data' },
    direction: { type: String, required: true, default: 'No data' },
    nearestCity: { type: String, required: true, default: 'No data' },
    reasoning: { type: String, required: true, default: 'No data' },
    confidence: { type: String, enum: ['High', 'Medium', 'Low', 'No data'], required: true, default: 'No data' },
    accuracyRadiusKm: { type: Number, required: true, default: -1 },
}, { _id: false });

const LogSchema = new Schema<ILog>({
  userName: { type: String, required: true, trim: true },
  imageName: { type: String, required: true },
  imagePath: { type: String, required: true },
  guess: { type: LocationGuessSchema, required: true },
  feedback: {
    type: String,
    enum: ['correct', 'incorrect', 'not provided'],
    default: 'not provided',
  },
  correctedCountry: { type: String },
  correctedState: { type: String },
  correctedCity: { type: String },
}, { timestamps: true }); // `timestamps: true` adds createdAt and updatedAt fields

const Log = model<ILog>('Log', LogSchema);

export default Log;
