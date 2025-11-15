
import React, { useState } from 'react';
import { analyzeImage } from '../../services/geminiService';
import { FileInput } from '../../components/common/FileInput';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      resolve({ data, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
  const [prompt, setPrompt] = useState('Describe this image in detail.');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    const url = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);
    setImage({ file, url, base64 });
    setAnalysis(null);
  };

  const handleSubmit = async () => {
    if (!image || prompt.trim() === '') return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeImage(prompt, image.base64);
      setAnalysis(result);
    } catch (err) {
      console.error('Image analysis failed:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Image Analysis</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Upload an image and ask a question about it.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          {image ? (
            <img src={image.url} alt="To be analyzed" className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <FileInput onFileSelect={handleFileSelect} accept="image/*" label="Upload Image" />
          )}
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner text="Analyzing..." size="lg" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : analysis ? (
            <p className="whitespace-pre-wrap">{analysis}</p>
          ) : (
            <p className="text-gray-400">Analysis will appear here.</p>
          )}
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          disabled={!image || isLoading}
          placeholder="What do you want to know about the image?"
        />
      </div>
    </div>
  );
};
