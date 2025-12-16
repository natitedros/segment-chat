import React from 'react';
import { Message, Role } from '../types';
import { User, Bot, Download, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const handleDownload = () => {
    if (message.attachment?.previewUrl) {
      const link = document.createElement('a');
      link.href = message.attachment.previewUrl;
      link.download = `gemini-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Image Attachment (Input or Output) */}
          {message.attachment && (
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white max-w-sm">
              <img 
                src={message.attachment.previewUrl} 
                alt="Attachment" 
                className="w-full h-auto max-h-[400px] object-cover" 
              />
              {!isUser && (
                <button 
                  onClick={handleDownload}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  title="Download Image"
                >
                  <Download size={16} />
                </button>
              )}
            </div>
          )}

          {/* Text Content */}
          {(message.text || message.isError) && (
            <div 
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                ${message.isError 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
            >
              {message.isError && (
                <div className="flex items-center gap-2 mb-1 font-semibold">
                  <AlertCircle size={14} />
                  <span>Error</span>
                </div>
              )}
              {message.text}
            </div>
          )}
          
          <span className="text-xs text-gray-400 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;