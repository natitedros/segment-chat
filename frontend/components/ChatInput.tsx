import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, Send, X, Image as ImageIcon } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachment?: Attachment) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height automatically
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    try {
      const base64 = "tempbase64";
      setAttachment({
        file,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        base64Data: base64
      });
    } catch (err) {
      console.error("Error reading file", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Reset value so same file can be selected again if cleared
    e.target.value = '';
  };

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we are leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const clearAttachment = () => {
    setAttachment(undefined);
  };

  const handleSubmit = () => {
    if ((!text.trim() && !attachment) || isLoading) return;
    
    onSend(text, attachment);
    setText('');
    setAttachment(undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div 
      className={`relative rounded-2xl border transition-all duration-200 bg-white shadow-sm
        ${isDragging ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30' : 'border-gray-200 focus-within:border-gray-300 focus-within:shadow-md'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay Text */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl text-indigo-600 font-medium">
          <ImageIcon size={48} className="mb-2 opacity-50" />
          <p>Drop image here</p>
        </div>
      )}

      <div className="p-3">
        {/* Attachment Preview */}
        {attachment && (
          <div className="flex items-start gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="relative group">
              <img 
                src={attachment.previewUrl} 
                alt="Preview" 
                className="h-20 w-auto rounded-lg object-cover border border-gray-200 shadow-sm" 
              />
              <button
                onClick={clearAttachment}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center h-20">
               <span className="text-sm font-medium text-gray-700 truncate">{attachment.file?.name || 'Image'}</span>
               <span className="text-xs text-gray-400">Attached</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shrink-0"
            title="Attach Image"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? "Describe how to edit this image..." : "Type a message or drag & drop an image..."}
            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none py-2.5 text-gray-800 placeholder-gray-400 max-h-[150px] overflow-y-auto"
            rows={1}
            disabled={isLoading}
          />

          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && !attachment) || isLoading}
            className={`p-2.5 rounded-xl transition-all duration-200 shrink-0
              ${(!text.trim() && !attachment) || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
              }`}
          >
            <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;