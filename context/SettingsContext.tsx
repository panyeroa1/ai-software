
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Settings, ProviderState } from '../types';

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULTS: Settings = {
  provider: 'gemini',
  ollamaCloudKey: '',
  ollamaCloudUrl: 'https://ollama.com',
  ollamaSelfHostedUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llava:latest',
  ollamaTtsUrl: 'http://127.0.0.1:5002/api/tts',
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('ai_settings');
      if (savedSettings) {
        // Merge saved settings with defaults to ensure all keys are present
        const parsed = JSON.parse(savedSettings);
        return { ...DEFAULTS, ...parsed };
      }
    } catch (error) {
      console.error('Could not parse settings from localStorage', error);
    }
    return DEFAULTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ai_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Could not save settings to localStorage', error);
    }
  }, [settings]);

  const setSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
