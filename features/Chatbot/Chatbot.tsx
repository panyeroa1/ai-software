
import React, { useState, useEffect, useRef } from 'react';
import { createChat, sendMessageToChat } from '../../services/geminiService';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';
import { Icon } from '../../components/Icon';
import type { Chat } from '@google/genai';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const Chatbot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChat(createChat());
    setMessages([{ sender: 'bot', text: "Hello! How can I help you today?" }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!chat || prompt.trim() === '') return;
    
    const userMessage: Message = { sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await sendMessageToChat(chat, prompt);
      const botMessage: Message = { sender: 'bot', text: response.text };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { sender: 'bot', text: 'Sorry, something went wrong. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">AI Chatbot</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white"><Icon name="spark" className="w-5 h-5"/></div>}
              <div className={`px-4 py-2 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white"><Icon name="spark" className="w-5 h-5"/></div>
               <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"><Spinner size="sm" /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSendMessage}
          disabled={isLoading}
          placeholder="Ask me anything..."
        />
      </div>
    </div>
  );
};
