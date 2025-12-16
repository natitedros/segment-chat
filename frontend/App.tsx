import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Since we can't use uuid lib without install, I'll use a simple generator
import MessageItem from './components/MessageItem';
import ChatInput from './components/ChatInput';
import { Message, Role, Attachment } from './types';
import { sendMessage } from './services/chatService';
import { Sparkles } from 'lucide-react';

// Simple ID generator since we can't rely on external uuid package in this environment
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    const userMessageId = generateId();
    
    // 1. Add User Message
    const newUserMessage: Message = {
      id: userMessageId,
      role: Role.USER,
      text: text,
      attachment: attachment,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // // 2. Call Gemini API
      const result = await sendMessage(text, attachment);

      // // 3. Add Model Response
      const botMessage: Message = {
        id: generateId(),
        role: Role.MODEL,
        text: result.text,
        attachment: result.imageAttachment,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);



    } catch (error) {
      console.error("Failed to generate response", error);
      const errorMessage: Message = {
        id: generateId(),
        role: Role.MODEL,
        text: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Segment Chat</h1>
            <p className="text-xs text-gray-500">Segment your objects</p>
          </div>
        </div>
        <a 
          href="https://ai.google.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          GitHub
        </a>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 my-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100">
                <Sparkles size={40} className="text-indigo-300" />
              </div>
              <h2 className="text-lg font-semibold text-gray-600 mb-2">Welcome to Segment-Chat</h2>
              <p className="max-w-md text-sm">
                Drag and drop an image to edit it, then type a prompt to customize the segmentations on the image by selecting the color of objects.
              </p>
            </div>
          ) : (
            <div className="flex-1 pb-4">
              {messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start w-full mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                        <Sparkles size={16} className="text-white animate-pulse" />
                      </div>
                      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white border-t border-gray-200 p-4 md:p-6 sticky bottom-0 z-20">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          <p className="text-center text-xs text-gray-400 mt-3">
            Let's segment your image.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;