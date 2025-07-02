import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { SendIcon } from './icons/SendIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ChatInterfaceProps {
  history: ChatMessage[];
  onSendMessage: (text: string, imageFile: File | null) => void;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [text]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (filePreview) {
          URL.revokeObjectURL(filePreview);
      }
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearAttachment = () => {
    setFile(null);
    if (filePreview) {
        URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() || file) {
      onSendMessage(text, file);
      setText('');
      clearAttachment();
    }
  };
  
  return (
    <div className="mt-8 w-full animate-fade-in flex flex-col bg-slate-800/60 border border-slate-700 rounded-lg shadow-lg max-h-[70vh]">
      <div className="p-4 border-b border-slate-600/70">
        <h3 className="text-lg font-semibold text-slate-200 text-center">Follow-up Chat</h3>
        <p className="text-sm text-slate-400 text-center">Ask questions or provide more clues to narrow down the location.</p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {history.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500/80 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-indigo-100" /></div>}
            <div className={`rounded-2xl p-3 max-w-md md:max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700/80 text-slate-200 rounded-bl-none'}`}>
              {msg.imagePreviewUrl && (
                <img src={msg.imagePreviewUrl} alt="clue" className="mb-2 rounded-lg max-h-48 w-full object-cover" />
              )}
              <p className="text-base" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.text}</p>
            </div>
             {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="w-5 h-5 text-slate-300" /></div>}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500/80 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-indigo-100" /></div>
                <div className="rounded-2xl p-3 max-w-lg bg-slate-700/80 rounded-bl-none">
                    <div className="flex items-center justify-center gap-2 h-6">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-600/70 bg-slate-800/70">
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
            <label htmlFor="file-upload" className="p-2 mt-1.5 rounded-full hover:bg-slate-600 cursor-pointer transition-colors flex-shrink-0">
                <PaperClipIcon className="w-6 h-6 text-slate-400" />
            </label>
            <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
                aria-label="Attach image"
            />
            <div className="flex-1 flex flex-col">
                {filePreview && (
                    <div className="mb-2 p-2 bg-slate-700/50 rounded-lg flex items-center gap-2 animate-fade-in">
                        <img src={filePreview} alt="preview" className="w-12 h-12 rounded-md object-cover" />
                        <span className="text-sm text-slate-300 truncate flex-1">{file?.name}</span>
                        <button type="button" onClick={clearAttachment} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-600" aria-label="Remove attachment">
                            <XMarkIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                        }
                    }}
                    placeholder="Type a message or add an image..."
                    className="flex-1 bg-slate-700 border-slate-600 rounded-lg p-2.5 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all"
                    rows={1}
                    style={{maxHeight: '150px'}}
                />
            </div>
            <button type="submit" disabled={isLoading || (!text.trim() && !file)} className="p-2 mt-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors flex-shrink-0" aria-label="Send message">
                <SendIcon className="w-6 h-6 text-white" />
            </button>
        </form>
      </div>
    </div>
  );
};
