export interface LocationGuess {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2 code
  state: string;
  city: string;
  direction: string; // e.g., 'Northeast', 'Southwest'
  nearestCity: string;
  reasoning: string;
  confidence: 'High' | 'Medium' | 'Low';
  accuracyRadiusKm: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreviewUrl?: string; // For displaying user-uploaded images in chat
}

export interface ContinueChatResponse {
  responseText: string;
  updatedGuess: LocationGuess | null;
}

/**
 * Local log entry structure. Mirrored in localStorage.
 */
export interface LogEntry {
  _id: string; // From MongoDB
  id: string; // Unique ID for React keys, can be same as _id
  userName: string;
  imageName: string;
  imagePreviewUrl?: string; // Frontend only, for the current session
  guess: LocationGuess;
  feedback: 'correct' | 'incorrect' | 'not provided';
  correctedCountry?: string;
  correctedState?: string;
  correctedCity?: string;
  createdAt: string; // From Mongoose timestamps
  updatedAt: string; // From Mongoose timestamps
}


/**
 * Defines the shape of the data sent to the backend API when updating a log.
 * All fields are optional, as it's a partial update (PATCH).
 */
export interface LogUpdatePayload {
  guess?: LocationGuess;
  feedback?: 'correct' | 'incorrect';
  correctedCountry?: string;
  correctedState?: string;
  correctedCity?: string;
}
