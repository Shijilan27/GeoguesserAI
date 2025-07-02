import type { LocationGuess, LogUpdatePayload, LogEntry } from '../types';

const API_BASE_URL = 'http://localhost:3001';

function fillGuessFields(guess: any): any {
  // Ensure all required fields are present and default to 'No data' if missing or empty
  return {
    country: guess.country || 'No data',
    countryCode: guess.countryCode || 'No data',
    state: guess.state || 'No data',
    city: guess.city || 'No data',
    direction: guess.direction || 'No data',
    nearestCity: guess.nearestCity || 'No data',
    reasoning: guess.reasoning || 'No data',
    confidence: guess.confidence || 'No data',
    accuracyRadiusKm: guess.accuracyRadiusKm ?? -1,
  };
}

/**
 * Logs the initial guess and the uploaded image to the backend database.
 * This function sends a POST request to the '/api/logs' endpoint.
 *
 * @param imageFile The image file uploaded by the user.
 * @param initialGuess The initial location guess from the AI.
 * @param userName The name of the user.
 * @returns The full log entry object created by the database.
 */
export const logGuess = async (imageFile: File, initialGuess: LocationGuess, userName: string): Promise<LogEntry> => {
  const formData = new FormData();
  formData.append('image', imageFile, imageFile.name);
  
  // Send the structured guess data as a JSON string. The backend will parse this.
  const logPayload = {
    userName,
    guess: fillGuessFields(initialGuess),
  };
  formData.append('logData', JSON.stringify(logPayload));

  console.log('Sending initial guess to backend via POST /api/logs');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to log guess to database: ${errorText || response.statusText}`);
    }

    const result: LogEntry = await response.json();
    
    if (!result || !result._id) {
        throw new Error('Backend did not return a valid log entry.');
    }
    
    console.log('Backend response:', result);
    return result;

  } catch (error) {
    console.error("Error in logGuess:", error);
    alert("Could not save log to the server. Please check your backend connection and ensure it's running.");
    // Rethrow to be caught by the calling function
    throw error;
  }
};

/**
 * Updates an existing log entry in the database (e.g., with feedback, correction, or a new guess).
 * This function sends a PATCH request to the '/api/logs/:id' endpoint.
 *
 * @param logId The database ID of the log entry to update.
 * @param updateData The data to update.
 * @returns The full, updated log entry from the database.
 */
export const updateLog = async (logId: string, updateData: LogUpdatePayload): Promise<LogEntry> => {
    if (!logId) {
        console.warn("Cannot update log: invalid logId provided.", { logId, updateData });
        throw new Error("Invalid logId for update.");
    }

    console.log(`Updating log ${logId} in backend via PATCH /api/logs/${logId}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/logs/${logId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update log in database: ${errorText || response.statusText}`);
        }

        const result: LogEntry = await response.json();
        console.log(`Log ${logId} updated successfully.`);
        return result;

    } catch(error) {
        console.error("Error in updateLog:", error);
        alert("Could not update log on the server. Please check your backend connection.");
        throw error;
    }
};
