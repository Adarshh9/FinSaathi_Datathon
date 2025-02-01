'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserButton } from "@clerk/nextjs";
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
          FS
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div className="flex flex-col">
          <div className={`p-3 rounded-lg ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
            <ReactMarkdown
              className={`markdown ${isUser ? 'text-white' : 'text-gray-900'}`}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-gray-200 text-gray-800 px-1 rounded">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{message.timestamp}</span>
            {message.status && (
              <span className="text-xs text-gray-500">✓</span>
            )}
          </div>
        </div>
      </div>
      {isUser && (
        <div className="ml-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = {
        type: 'text',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ message: inputValue }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'success') {
          setMessages(prev => [...prev, data.response]);
        } else {
          throw new Error(data.message || 'Server error');
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          type: 'text',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">FinSaathi AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isUser={index % 2 === 0}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Copy className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <ThumbsUp className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <ThumbsDown className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask FinSaathi about your finances..."
            className="flex-1 bg-transparent outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className={`p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;