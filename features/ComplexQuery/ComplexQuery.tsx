
import React, { useState } from 'react';
import { complexQuery } from '../../services/geminiService';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';

export const ComplexQuery: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (prompt.trim() === '') return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await complexQuery(prompt);
      setResponse(result);
    } catch (err) {
      console.error('Complex query failed:', err);
      setError('Failed to get a response. Please try a different query.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Complex Query</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ask complex questions that require deep reasoning or planning. This mode uses Gemini Pro with an enhanced thinking budget.</p>
      </div>

      <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner text="Thinking deeply..." size="lg" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : response ? (
          <p className="whitespace-pre-wrap">{response}</p>
        ) : (
          <p className="text-gray-400">The model's detailed response will appear here.</p>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="e.g., Plan a 3-day trip to Tokyo with a focus on technology and food..."
        />
      </div>
    </div>
  );
};
