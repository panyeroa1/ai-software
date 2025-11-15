
import React, { useState, useEffect } from 'react';
import { groundedSearch } from '../../services/aiService';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';
import { Icon } from '../../components/Icon';
import { useSettings } from '../../context/SettingsContext';

export const GroundedSearch: React.FC = () => {
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [useMaps, setUseMaps] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [response, setResponse] = useState<{text: string, chunks: any[]} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useMaps && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.warn('Could not get location:', err.message);
          setError('Could not get your location. Please enable location services.');
        }
      );
    }
  }, [useMaps, userLocation]);

  const handleSubmit = async () => {
    if (prompt.trim() === '') return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const location = useMaps && userLocation ? userLocation : undefined;
      const result = await groundedSearch(prompt, useMaps, settings, location);
      setResponse(result);
    } catch (err: any) {
      console.error('Grounded search failed:', err);
      setError(`Failed to get a response: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getChunkTitle = (chunk: any) => {
    if (chunk.web) return chunk.web.title;
    if (chunk.maps) return chunk.maps.title;
    return 'Source';
  }

  const getChunkUri = (chunk: any) => {
    if (chunk.web) return chunk.web.uri;
    if (chunk.maps) return chunk.maps.uri;
    return '#';
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Grounded Search</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions about recent events, news, or places to get answers grounded in real-world data.</p>
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name="searchType" checked={!useMaps} onChange={() => setUseMaps(false)} className="form-radio text-primary" />
            <span>Google Search</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name="searchType" checked={useMaps} onChange={() => setUseMaps(true)} className="form-radio text-primary" />
            <span>Google Maps</span>
          </label>
        </div>
      </div>

      <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner text="Searching..." size="lg" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : response ? (
          <div>
            <p className="whitespace-pre-wrap">{response.text}</p>
            {response.chunks.length > 0 && (
              <div className="mt-6 border-t pt-4 dark:border-gray-700">
                <h3 className="text-md font-semibold mb-2">Sources:</h3>
                <ul className="space-y-2">
                  {response.chunks.map((chunk, index) => (
                    <li key={index} className="text-sm">
                      <a href={getChunkUri(chunk)} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
                        <Icon name={chunk.web ? 'web' : 'location'} className="w-4 h-4 mr-2" />
                        {getChunkTitle(chunk)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Results will appear here.</p>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          disabled={isLoading || (useMaps && !userLocation)}
          placeholder={useMaps ? "e.g., Good Italian restaurants nearby" : "e.g., Who won the last F1 race?"}
        />
      </div>
    </div>
  );
};
