import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Icon } from './Icon';
import type { Settings, ProviderState } from '../types';
import { listOllamaModels } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  // Fetch Ollama models when provider is selected
  useEffect(() => {
    if (!isOpen || !localSettings.provider.startsWith('ollama')) {
      setOllamaModels([]);
      setModelsError(null);
      return;
    }

    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelsError(null);
      try {
        const modelList = await listOllamaModels(localSettings);
        setOllamaModels(modelList);
        if (modelList.length === 0) {
          setModelsError("No models found. Check your Ollama server URL and make sure it's running.");
        }
      } catch (error: any) {
        setModelsError(`Failed to fetch models: ${error.message}`);
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    // Debounce fetching to avoid spamming while the user types the URL
    const debounceTimeout = setTimeout(fetchModels, 300);

    return () => clearTimeout(debounceTimeout);

  }, [isOpen, localSettings.provider, localSettings.ollamaSelfHostedUrl, localSettings.ollamaCloudUrl, localSettings.ollamaCloudKey]);


  const handleSave = () => {
    setSettings(localSettings);
    onClose();
  };

  const handleProviderChange = (provider: ProviderState) => {
    setLocalSettings(prev => ({ ...prev, provider }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({...prev, [name]: value}));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-light dark:bg-secondary rounded-lg shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Provider</label>
            <div className="space-y-2">
              <RadioOption id="gemini" label="Gemini" provider="gemini" checked={localSettings.provider === 'gemini'} onChange={handleProviderChange} />
              <RadioOption id="ollama_cloud" label="Ollama Cloud" provider="ollama_cloud" checked={localSettings.provider === 'ollama_cloud'} onChange={handleProviderChange} />
              <RadioOption id="ollama_self_hosted" label="Ollama Self-hosted" provider="ollama_self_hosted" checked={localSettings.provider === 'ollama_self_hosted'} onChange={handleProviderChange} />
            </div>
          </div>
          
          {localSettings.provider.startsWith('ollama') && (
            <div className="p-4 border rounded-md dark:border-gray-600 space-y-4">
              <h3 className="font-semibold text-md">Ollama Configuration</h3>
               {localSettings.provider === 'ollama_cloud' && (
                <>
                  <InputField label="Cloud URL" name="ollamaCloudUrl" value={localSettings.ollamaCloudUrl} onChange={handleInputChange} placeholder="Enter your Ollama Cloud URL" />
                  <InputField label="API Key" name="ollamaCloudKey" value={localSettings.ollamaCloudKey} onChange={handleInputChange} type="password" placeholder="Enter your Ollama Cloud API key" />
                   <p className="text-xs text-gray-500 dark:text-gray-400">
                    Note: This is for Ollama's official cloud service or a compatible hosted provider. The URL may vary.
                  </p>
                </>
              )}
               {localSettings.provider === 'ollama_self_hosted' && (
                <>
                  <InputField label="Server URL" name="ollamaSelfHostedUrl" value={localSettings.ollamaSelfHostedUrl} onChange={handleInputChange} placeholder="e.g., http://localhost:11434" />
                  <InputField label="TTS Server URL" name="ollamaTtsUrl" value={localSettings.ollamaTtsUrl} onChange={handleInputChange} placeholder="e.g., http://localhost:5002/api/tts" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Note: Text-to-Speech requires a separate TTS server (e.g., Piper) running.
                  </p>
                </>
              )}
               <ModelSelector
                value={localSettings.ollamaModel}
                onChange={handleInputChange}
                models={ollamaModels}
                isLoading={isLoadingModels}
                error={modelsError}
              />
               <p className="text-xs text-gray-500 dark:text-gray-400">
                  Note: For image analysis, ensure you are using a vision-capable model like LLaVA.
               </p>
            </div>
          )}

          {localSettings.provider === 'gemini' && (
             <div className="p-4 border rounded-md dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-300">The Gemini provider uses the API Key provided by the environment. No further configuration is needed here.</p>
             </div>
          )}

        </div>

        <div className="flex justify-end p-4 border-t dark:border-gray-700">
          <button onClick={handleSave} className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const RadioOption: React.FC<{id: string, label: string, provider: ProviderState, checked: boolean, onChange: (provider: ProviderState) => void}> = ({ id, label, provider, checked, onChange }) => (
    <label htmlFor={id} className="flex items-center p-3 w-full bg-gray-100 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
      <input type="radio" id={id} name="provider" value={provider} checked={checked} onChange={() => onChange(provider)} className="form-radio h-4 w-4 text-primary" />
      <span className="ml-3 text-sm font-medium">{label}</span>
    </label>
);

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, type?: string}> = ({label, name, value, onChange, placeholder, type="text"}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full px-3 py-2 bg-light dark:bg-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const ModelSelector: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  models: string[];
  isLoading: boolean;
  error: string | null;
}> = ({ value, onChange, models, isLoading, error }) => {
  return (
    <div>
      <label htmlFor="ollamaModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model Name</label>
      <input
        type="text"
        name="ollamaModel"
        id="ollamaModel"
        value={value}
        onChange={onChange}
        placeholder={isLoading ? "Loading models..." : "Select or type a model name"}
        className="mt-1 block w-full px-3 py-2 bg-light dark:bg-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        list="ollama-models-list"
        disabled={isLoading}
      />
      <datalist id="ollama-models-list">
        {models.map(model => <option key={model} value={model} />)}
      </datalist>
      {isLoading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fetching available models...</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};