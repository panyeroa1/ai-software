import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './features/Chatbot/Chatbot';
import { ImageGenerator } from './features/ImageGenerator/ImageGenerator';
import { ImageEditor } from './features/ImageEditor/ImageEditor';
import { ImageAnalyzer } from './features/ImageAnalyzer/ImageAnalyzer';
import { VideoAnalyzer } from './features/VideoAnalyzer/VideoAnalyzer';
import { GroundedSearch } from './features/GroundedSearch/GroundedSearch';
import { ComplexQuery } from './features/ComplexQuery/ComplexQuery';
import { TextToSpeech } from './features/TextToSpeech/TextToSpeech';
import { AudioTranscription } from './features/AudioTranscription/AudioTranscription';
import { VoiceAssistant } from './features/VoiceAssistant/VoiceAssistant';
import type { Feature } from './types';
import { FEATURES } from './constants';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { Icon } from './components/Icon';

const PROVIDER_NAMES = {
  gemini: 'Gemini',
  ollama_cloud: 'Ollama Cloud',
  ollama_self_hosted: 'Ollama Self-hosted',
};

const FeatureNotSupported: React.FC = () => {
  const { settings } = useSettings();
  const providerName = PROVIDER_NAMES[settings.provider] || 'the selected provider';
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-light dark:bg-secondary rounded-lg shadow-lg p-8">
      <Icon name="brain" className="w-16 h-16 text-primary mb-4" />
      <h2 className="text-2xl font-bold mb-2">Feature Not Supported</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This feature is not available for <span className="font-semibold">{providerName}</span>.
        <br />
        Please select a different feature or change the provider in the settings.
      </p>
    </div>
  );
}


const AppContent: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(FEATURES[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useSettings();

  const isFeatureSupported = activeFeature.supportedProviders.includes(settings.provider);

  const renderActiveFeature = useCallback(() => {
     if (!isFeatureSupported) {
      return <FeatureNotSupported />;
    }
    switch (activeFeature.id) {
      case 'chatbot':
        return <Chatbot />;
      case 'voice-assistant':
        return <VoiceAssistant />;
      case 'image-generator':
        return <ImageGenerator />;
      case 'image-editor':
        return <ImageEditor />;
      case 'image-analyzer':
        return <ImageAnalyzer />;
      case 'video-analyzer':
        return <VideoAnalyzer />;
      case 'grounded-search':
        return <GroundedSearch />;
      case 'complex-query':
        return <ComplexQuery />;
      case 'tts':
        return <TextToSpeech />;
      case 'audio-transcription':
        return <AudioTranscription />;
      default:
        return <Chatbot />;
    }
  }, [activeFeature, isFeatureSupported]);

  return (
    <>
      <div className="flex h-screen bg-gray-100 dark:bg-dark font-sans">
        <Sidebar
          features={FEATURES}
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto h-full">
            {renderActiveFeature()}
          </div>
        </main>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;