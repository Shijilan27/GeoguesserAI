import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import type { LocationGuess } from '../types';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { TargetIcon } from './icons/TargetIcon';


interface ResultDisplayProps {
  guess: LocationGuess;
  onFeedback: (feedback: 'correct' | 'incorrect') => void;
  feedback: 'correct' | 'incorrect' | null;
  showCorrectionForm: boolean;
  onCorrectionSubmit: (correctedData: { country: string; state: string; city: string; }) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ guess, onFeedback, feedback, showCorrectionForm, onCorrectionSubmit }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (feedback === 'correct') {
      setShowConfetti(true);
    }
  }, [feedback]);

  const flagUrl =
    guess.countryCode &&
    guess.countryCode.toLowerCase() !== 'n/a' &&
    guess.countryCode.length === 2
      ? `https://flagcdn.com/w80/${guess.countryCode.toLowerCase()}.png`
      : undefined;

  const getConfidenceClass = (confidence: LocationGuess['confidence']) => {
    switch (confidence) {
      case 'High':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'Low':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-slate-600 text-slate-300';
    }
  };

  const [correction, setCorrection] = useState({
    country: '',
    state: '',
    city: '',
  });

  useEffect(() => {
    setCorrection({
      country: guess.country,
      state: guess.state,
      city: guess.city,
    });
  }, [guess]);

  const handleCorrectionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCorrectionSubmit(correction);
  };


  return (
    <div className="mt-8 w-full animate-fade-in">
       {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          onConfettiComplete={() => setShowConfetti(false)}
          className="w-full h-full"
        />
      )}
      <h2 className="text-2xl font-semibold text-center mb-4 text-slate-200">AI's Guess</h2>
      
      {/* Accuracy Assessment */}
      <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700 shadow-lg mb-6">
        <h3 className="text-base font-semibold text-slate-300 mb-3 text-center">Accuracy Assessment</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-3 text-center">
            <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-6 h-6 text-slate-400" />
                <span className="font-semibold text-slate-300">Confidence:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${getConfidenceClass(guess.confidence)}`}>
                    {guess.confidence || 'N/A'}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <TargetIcon className="w-6 h-6 text-slate-400" />
                <span className="font-semibold text-slate-300">Radius:</span>
                <span className="font-bold text-slate-100">~{guess.accuracyRadiusKm} km</span>
            </div>
        </div>
      </div>


      {/* Location card */}
      <div className="bg-slate-800/70 p-6 rounded-xl border border-slate-700 shadow-lg mb-6">
        {/* Country Section */}
        <div className="flex items-center gap-4">
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={`${guess.country} flag`}
              className="h-10 w-auto rounded-md shadow-md bg-slate-700 flex-shrink-0"
            />
          ) : (
            <div className="w-[60px] h-10 flex items-center justify-center bg-slate-700 rounded-md shadow-md flex-shrink-0">
              <span className="text-slate-500 text-xs">N/A</span>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-400">Country</p>
            <p className="text-2xl font-bold text-slate-50 break-words">{guess.country}</p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-700 my-4" />

        {/* State & City Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400">State / Province</p>
            <p className="text-lg font-semibold text-slate-200 break-words">{guess.state}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">City</p>
            <p className="text-lg font-semibold text-slate-200 break-words">{guess.city}</p>
          </div>
        </div>

        {/* New Section for more context */}
        <div className="mt-4 pt-4 border-t border-slate-700/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-slate-400">Region in Country</p>
                    <p className="text-lg font-semibold text-slate-200 break-words">{guess.direction}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-400">Nearest Major City</p>
                    <p className="text-lg font-semibold text-slate-200 break-words">{guess.nearestCity}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Reasoning Section */}
      <div className="bg-slate-800/70 p-5 rounded-lg border border-slate-700">
        <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-300 mb-2">
          <LightBulbIcon className="w-6 h-6 text-yellow-400" />
          Reasoning
        </h3>
        <p className="text-slate-400">{guess.reasoning || 'No reasoning provided.'}</p>
      </div>

      {/* Feedback Section */}
      <div className="mt-6 text-center p-4">
        {feedback === 'incorrect' && showCorrectionForm ? (
          <div className="animate-fade-in w-full max-w-lg mx-auto">
            <h4 className="font-semibold text-lg text-slate-200 mb-2">Help the AI Learn!</h4>
            <p className="text-sm text-slate-400 mb-4">Please provide the correct location below.</p>
            <form onSubmit={handleCorrectionFormSubmit} className="space-y-4 text-left">
              <div>
                <label htmlFor="country-correction" className="block text-sm font-medium text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  id="country-correction"
                  value={correction.country}
                  onChange={(e) => setCorrection({ ...correction, country: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="state-correction" className="block text-sm font-medium text-slate-300 mb-1">State / Province</label>
                <input
                  type="text"
                  id="state-correction"
                  value={correction.state}
                  onChange={(e) => setCorrection({ ...correction, state: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="city-correction" className="block text-sm font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  id="city-correction"
                  value={correction.city}
                  onChange={(e) => setCorrection({ ...correction, city: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  required
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Submit Correction
                </button>
              </div>
            </form>
          </div>
        ) : feedback === 'correct' ? (
          <div className="animate-fade-in flex flex-col items-center justify-center gap-1">
              <h4 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-yellow-300 to-emerald-400 py-2">
                  Hooray! Correct!
              </h4>
              <p className="text-slate-300">Thanks for the confirmation!</p>
          </div>
        ) : feedback === 'incorrect' ? (
            <div className="text-lg text-emerald-400 font-medium animate-fade-in flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-6 h-6" />
              Thanks for your feedback!
            </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-slate-400 mb-3">Was this guess correct?</p>
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => onFeedback('correct')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-800/50 border border-emerald-600/80 text-emerald-300 rounded-lg hover:bg-emerald-700/60 transition-colors duration-200 transform hover:scale-105"
                aria-label="Mark guess as correct"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Correct
              </button>
              <button
                onClick={() => onFeedback('incorrect')}
                className="flex items-center gap-2 px-4 py-2 bg-red-800/50 border border-red-600/80 text-red-300 rounded-lg hover:bg-red-700/60 transition-colors duration-200 transform hover:scale-105"
                aria-label="Mark guess as incorrect"
              >
                <XCircleIcon className="w-5 h-5" />
                Incorrect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};