
import React, { useState } from 'react';
import { generateImage } from '../../services/aiService';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';
import type { AspectRatio } from '../../types';
import { ASPECT_RATIOS } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

export const ImageGenerator: React.FC = () => {
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (prompt.trim() === '') return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const base64Image = await generateImage(prompt, aspectRatio, settings);
      setImageUrl(`data:image/jpeg;base64,${base64Image}`);
    } catch (err: any) {
      console.error('Image generation failed:', err);
      setError(`Failed to generate image: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Image Generation</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Describe the image you want to create. Be as detailed as you like.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <Spinner text="Generating your masterpiece..." size="lg" />
        ) : error ? (
          <div className="text-center text-red-500">
            <p><strong>Error:</strong> {error}</p>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="text-center text-gray-400">
            <p>Your generated image will appear here.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                aspectRatio === ratio
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="e.g., A futuristic cityscape at sunset, neon lights"
        />
      </div>
    </div>
  );
};
