
import React, { useState } from 'react';
import { editImage } from '../../services/geminiService';
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

export const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    const url = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);
    setOriginalImage({ file, url, base64 });
    setEditedImageUrl(null);
  };

  const handleSubmit = async () => {
    if (!originalImage || prompt.trim() === '') return;
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const resultBase64 = await editImage(prompt, originalImage.base64);
      if (resultBase64) {
        setEditedImageUrl(`data:image/png;base64,${resultBase64}`);
      } else {
        throw new Error('No image data returned from API.');
      }
    } catch (err) {
      console.error('Image editing failed:', err);
      setError('Failed to edit image. Please try another prompt or image.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
       <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Image Editing</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Upload an image and tell me how you'd like to change it.</p>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Original</h3>
          {originalImage ? (
            <img src={originalImage.url} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <FileInput onFileSelect={handleFileSelect} accept="image/*" label="Upload Image" />
          )}
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
           <h3 className="text-lg font-medium mb-2">Edited</h3>
           {isLoading ? (
            <Spinner text="Applying edits..." size="lg" />
           ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
           ) : editedImageUrl ? (
            <img src={editedImageUrl} alt="Edited" className="max-w-full max-h-full object-contain rounded-lg" />
           ) : (
            <p className="text-gray-400 text-center">Your edited image will appear here.</p>
           )}
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          disabled={!originalImage || isLoading}
          placeholder="e.g., Add a retro filter, or remove the background"
        />
      </div>
    </div>
  );
};
