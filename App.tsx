import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { startLocationChat, continueChat } from './services/geminiService';
import { logGuess, updateLog } from './services/apiService';
import type { LocationGuess, ChatMessage, LogUpdatePayload, LogEntry } from './types';
import { MapPinIcon } from './components/icons/MapPinIcon';
import type { Chat } from '@google/genai';
import { ChatInterface } from './components/ChatInterface';
import AdminLogViewer from './components/AdminLogViewer';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

const MainApp: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [guess, setGuess] = useState<LocationGuess | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Hybrid logging state: local and remote
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  const [showAdmin, setShowAdmin] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('geoGuesserUserName');
      if (storedName) {
        setUserName(storedName);
      }
      const storedLogs = localStorage.getItem('geoGuesserLogs');
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error("Could not load data from localStorage", error);
    }
  }, []);

  // Persist logs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('geoGuesserLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }, [logs]);
  
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    if (trimmedName) {
        try {
            localStorage.setItem('geoGuesserUserName', trimmedName);
            setUserName(trimmedName);
            setNameInput('');
        } catch (error) {
            console.error("Could not save user name to localStorage", error);
            setError("Could not save your name. Please ensure you're not in private browsing mode.");
        }
    }
  };

  const handleImageChange = (file: File) => {
    resetState();
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };
  
  const resetState = () => {
    setImageFile(null);
    setGuess(null);
    setError(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setChatInstance(null);
    chatHistory.forEach(msg => {
      if (msg.imagePreviewUrl) {
        URL.revokeObjectURL(msg.imagePreviewUrl);
      }
    });
    setChatHistory([]);
    setIsLoading(false);
    setIsChatLoading(false);
    setFeedback(null);
    setShowCorrectionForm(false);
    setCurrentLogId(null);
  };

  const handleGuess = useCallback(async () => {
    if (!imageFile || !userName) return;

    setIsLoading(true);
    setError(null);
    setGuess(null);
    setChatHistory([]);

    try {
      const base64Image = await fileToBase64(imageFile);
      const { chat, initialGuess } = await startLocationChat(base64Image);
      
      setGuess(initialGuess);
      setChatInstance(chat);

      // Log to backend AND local state
      const newLogFromServer = await logGuess(imageFile, initialGuess, userName);
      setCurrentLogId(newLogFromServer._id);
      
      const localLogEntry: LogEntry = {
        ...newLogFromServer,
        id: newLogFromServer._id,
        imagePreviewUrl: URL.createObjectURL(imageFile) // keep preview for local session
      };

      setLogs(prev => [...prev, localLogEntry]);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, userName]);

  const handleSendMessage = useCallback(async (message: string, attachedFile: File | null) => {
    if (!chatInstance || (!message.trim() && !attachedFile)) return;

    setIsChatLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: message,
      imagePreviewUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const imageBase64 = attachedFile ? await fileToBase64(attachedFile) : null;
      const { responseText, updatedGuess } = await continueChat(chatInstance, message, imageBase64);
      
      const newMessages: ChatMessage[] = [];

      if (updatedGuess) {
        setGuess(updatedGuess);
        setFeedback(null);
        setShowCorrectionForm(false);
        if (currentLogId) {
          updateLog(currentLogId, { guess: updatedGuess }).then(updatedLogFromServer => {
            setLogs(prev => prev.map(log => log.id === currentLogId ? { ...log, ...updatedLogFromServer } : log));
          }).catch(err => {
            console.error("Failed to update log with new guess:", err);
          });
        }
        newMessages.push({
          id: Date.now().toString() + '-update',
          role: 'model',
          text: "Based on your new clues, I've updated my guess! Check it out above.",
        });
      }

      if (responseText) {
        newMessages.push({
            id: Date.now().toString() + '-ai',
            role: 'model',
            text: responseText,
        });
      }

      if (newMessages.length > 0) {
        setChatHistory(prev => [...prev, ...newMessages]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      const errorBubble: ChatMessage = {
          id: Date.now().toString() + '-err',
          role: 'model',
          text: `Sorry, I encountered an error: ${errorMessage}`,
      };
      setChatHistory(prev => [...prev, errorBubble]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInstance, currentLogId]);

  const handleFeedback = (feedbackType: 'correct' | 'incorrect') => {
    setFeedback(feedbackType);
     if (currentLogId) {
        updateLog(currentLogId, { feedback: feedbackType }).then(updatedLogFromServer => {
            setLogs(prev => prev.map(log => log.id === currentLogId ? { ...log, ...updatedLogFromServer } : log));
        }).catch(err => {
            console.error("Failed to update log feedback:", err);
        });
    }

    if (feedbackType === 'correct') {
      setShowCorrectionForm(false);
    } else {
      setShowCorrectionForm(true);
    }
  };

  const handleCorrectionSubmit = async (correctedData: { country: string; state: string; city: string; }) => {
    setShowCorrectionForm(false);

    if (currentLogId) {
        const payload: LogUpdatePayload = {
            feedback: 'incorrect',
            correctedCountry: correctedData.country,
            correctedState: correctedData.state,
            correctedCity: correctedData.city,
        };
        updateLog(currentLogId, payload).then(updatedLogFromServer => {
          setLogs(prev => prev.map(log => log.id === currentLogId ? { ...log, ...updatedLogFromServer } : log));
        }).catch(err => {
            console.error("Failed to submit correction to log:", err);
        });
    }
    
    if (chatInstance) {
        const correctionMessageToAI = `My previous feedback was 'incorrect'. The actual location is Country: ${correctedData.country}, State: ${correctedData.state}, City: ${correctedData.city}.`;
        
        const userMessageToUI: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: 'Thanks! I have submitted the correct location.',
        };
        setChatHistory(prev => [...prev, userMessageToUI]);

        setIsChatLoading(true);
        try {
            const { responseText } = await continueChat(chatInstance, correctionMessageToAI, null);
            if (responseText) {
                 const aiAck: ChatMessage = {
                     id: Date.now().toString() + '-ack',
                     role: 'model',
                     text: responseText
                 };
                 setChatHistory(prev => [...prev, aiAck]);
            }
        } catch(err) {
             const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
             const errorBubble: ChatMessage = {
                 id: Date.now().toString() + '-err',
                 role: 'model',
                 text: `Sorry, I encountered an error sending the correction: ${errorMessage}`,
             };
             setChatHistory(prev => [...prev, errorBubble]);
        } finally {
            setIsChatLoading(false);
        }
    }
  };

  const handleDownloadLog = () => {
    if (logs.length === 0) {
      alert("No logs to download.");
      return;
    }
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geoguesser_log_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    if (window.confirm("Are you sure you want to clear your local guess log? This cannot be undone.")) {
      setLogs([]);
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    return () => {
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        chatHistory.forEach(msg => {
            if (msg.imagePreviewUrl) {
                URL.revokeObjectURL(msg.imagePreviewUrl);
            }
        });
    };
  }, [imagePreviewUrl, chatHistory]);

  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans text-white antialiased">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => navigate('/admin')}
            className="bg-indigo-700 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
          >
            Admin Logs
          </button>
        </div>
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            GeoGuesser AI
          </h1>
            {userName ? (
              <p className="text-slate-400 text-lg">
                Welcome, <span className="font-bold text-indigo-300">{userName}</span>! Upload an image to begin.
              </p>
            ) : (
              <p className="text-slate-400 text-lg">Please enter your name to get started.</p>
            )}
        </header>

        <main className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300">
          {!userName ? (
            <div className="animate-fade-in">
              <form onSubmit={handleNameSubmit} className="flex flex-col items-center gap-4">
                <label htmlFor="name-input" className="sr-only">Your Name</label>
                <input
                  id="name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name here"
                  className="w-full max-w-sm bg-slate-700 border border-slate-600 rounded-md py-3 px-4 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-center"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Let's Go!
                </button>
              </form>
            </div>
          ) : (
            <>
              {!imagePreviewUrl && !guess && (
                <ImageUploader onImageUpload={handleImageChange} />
              )}

              {imagePreviewUrl && !guess && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-lg mb-6 rounded-lg overflow-hidden shadow-lg border-2 border-slate-600">
                    <img src={imagePreviewUrl} alt="Location preview" className="w-full h-auto object-cover"/>
                  </div>

                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <div className="flex flex-wrap justify-center gap-4">
                      <button
                        onClick={handleGuess}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <MapPinIcon className="w-5 h-5" />
                        Guess Location
                      </button>
                       <button
                        onClick={resetState}
                        className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-6 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              )}
              
              {guess && (
                <div key={JSON.stringify(guess)} className="animate-fade-in">
                  <ResultDisplay 
                    guess={guess}
                    onFeedback={handleFeedback}
                    feedback={feedback}
                    showCorrectionForm={showCorrectionForm}
                    onCorrectionSubmit={handleCorrectionSubmit}
                  />
                  <ChatInterface 
                    history={chatHistory} 
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading} 
                  />
                  <div className="mt-8 flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={resetState}
                      disabled={!feedback || showCorrectionForm}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      aria-describedby={!feedback || showCorrectionForm ? "feedback-prompt" : undefined}
                    >
                      New Guess?
                    </button>
                    {(!feedback || showCorrectionForm) && (
                      <p id="feedback-prompt" className="text-xs text-slate-400 animate-pulse">
                        Please provide feedback above to start a new guess.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        
        {userName && (
          <footer className="text-center mt-8 px-4 text-slate-500 text-sm">
             {logs.length > 0 && (
              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-400 mb-2">You have {logs.length} guess(es) in your local log.</p>
                <div className="flex justify-center gap-4">
                  <button onClick={handleDownloadLog} className="text-indigo-400 hover:text-indigo-300 font-semibold">Download My Log</button>
                  <button onClick={handleClearLog} className="text-red-400 hover:text-red-300 font-semibold">Clear My Log</button>
                </div>
                 <p className="text-xs text-slate-600 mt-3">Note: This log is stored on your device and is not shared with other users. Clearing it will not affect the central database.</p>
              </div>
            )}
            <p>Developed by Shijilan 2025. Guesses may not always be accurate.</p>
          </footer>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLogViewer />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default App;
