
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
import type { Feature } from './types';
import { FEATURES } from './constants';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(FEATURES[0]);

  const renderActiveFeature = useCallback(() => {
    switch (activeFeature.id) {
      case 'chatbot':
        return <Chatbot />;
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
  }, [activeFeature]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Sidebar
        features={FEATURES}
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto h-full">
          {renderActiveFeature()}
        </div>
      </main>
    </div>
  );
};

export default App;
