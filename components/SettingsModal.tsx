
import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Icon } from './Icon';
import type { Settings, ProviderState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
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
                <InputField label="API Key" name="ollamaCloudKey" value={localSettings.ollamaCloudKey} onChange={handleInputChange} type="password" placeholder="Enter your Ollama Cloud API key" />
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
               <InputField label="Model Name" name="ollamaModel" value={localSettings.ollamaModel} onChange={handleInputChange} placeholder="e.g., llava:latest or llama3" />
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
        <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);