import React, { useState, useEffect } from 'react';
import { generateSpeech } from '../../services/aiService';
import { Spinner } from '../../components/Spinner';
import { useSettings } from '../../context/SettingsContext';
import { Icon } from '../../components/Icon';
import type { SpeechConfig } from '../../types';
import { decode, decodeAudioData, bufferToWave } from '../../utils/audio';

const VOICES = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];

export const TextToSpeech: React.FC = () => {
  const { settings } = useSettings();
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [text, setText] = useState('Hello! I am Gemini. It is a pleasure to meet you.');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<'wav' | 'mp3'>('wav');

  const [singleVoice, setSingleVoice] = useState('Kore');
  const [speakers, setSpeakers] = useState([
    { id: 1, name: 'Joe', voice: 'Kore' },
    { id: 2, name: 'Jane', voice: 'Puck' },
  ]);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  
  // Update example text when mode changes
  useEffect(() => {
    if (mode === 'single') {
      setText('Hello! I am Gemini. It is a pleasure to meet you.');
    } else {
      setText("Joe: How's it going today Jane?\nJane: Not too bad, how about you?");
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  const handleSpeakerChange = (id: number, field: 'name' | 'voice', value: string) => {
    setSpeakers(currentSpeakers =>
      currentSpeakers.map(speaker =>
        speaker.id === id ? { ...speaker, [field]: value } : speaker
      )
    );
  };

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    setIsLoading(true);
    setError(null);
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
    }

    try {
      const isOllama = settings.provider === 'ollama_self_hosted';
      // FIX: Explicitly type `config` to prevent TypeScript from widening the `mode` property to `string`.
      const config: SpeechConfig = (isOllama || mode === 'single')
        ? { mode: 'single', voice: singleVoice }
        : { mode: 'multi', speakers };
        
      const base64Audio = await generateSpeech(text, settings, config, audioFormat);

      if (base64Audio) {
        const decodedBytes = decode(base64Audio);
        let audioBlob: Blob;

        if (isOllama) {
            const mimeType = audioFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';
            audioBlob = new Blob([decodedBytes], { type: mimeType });
        } else {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext)({ sampleRate: 24000 });
            }
            const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current);
            audioBlob = bufferToWave(audioBuffer, audioBuffer.length);
        }
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else {
        throw new Error('No audio data received.');
      }
    } catch (err: any) {
      console.error('TTS failed:', err);
      setError(`Failed to generate speech: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isMultiSpeakerDisabled = settings.provider !== 'gemini';

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="p-4 bg-light dark:bg-secondary rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Text to Speech</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Convert text into natural-sounding speech. Multi-speaker mode is only available with Gemini.</p>
      </div>
      
      <div className="p-4 bg-light dark:bg-secondary rounded-lg shadow space-y-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            <TabButton label="Single Speaker" isActive={mode === 'single'} onClick={() => setMode('single')} />
            <TabButton label="Multi Speaker" isActive={mode === 'multi'} onClick={() => setMode('multi')} disabled={isMultiSpeakerDisabled} />
        </div>

        {mode === 'single' || isMultiSpeakerDisabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="voice-select" className="block text-sm font-medium mb-1">Voice:</label>
                    <select id="voice-select" value={singleVoice} onChange={e => setSingleVoice(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                        {VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                    </select>
                </div>
                {settings.provider === 'ollama_self_hosted' && (
                    <div>
                        <label htmlFor="format-select" className="block text-sm font-medium mb-1">Format:</label>
                        <select id="format-select" value={audioFormat} onChange={e => setAudioFormat(e.target.value as 'wav' | 'mp3')} className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                            <option value="wav">WAV</option>
                            <option value="mp3">MP3</option>
                        </select>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Define two speakers. The names must match those in the text prompt (e.g., "Joe: ...").</p>
                {speakers.map((speaker, index) => (
                    <div key={speaker.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <input type="text" value={speaker.name} onChange={e => handleSpeakerChange(speaker.id, 'name', e.target.value)} placeholder={`Speaker ${index + 1} Name`} className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                        <select value={speaker.voice} onChange={e => handleSpeakerChange(speaker.id, 'voice', e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                            {VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="flex-1 p-4 bg-light dark:bg-secondary rounded-lg shadow flex flex-col items-center justify-center">
        {isLoading ? (
          <Spinner text="Generating audio..." size="lg" />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : audioUrl ? (
          <audio controls src={audioUrl} className="w-full max-w-md" />
        ) : (
          <p className="text-gray-400">Your generated audio will appear here.</p>
        )}
      </div>

      <div className="p-4 bg-light dark:bg-secondary rounded-lg shadow">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            rows={4}
            placeholder="Enter text to convert to speech..."
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || text.trim() === ''}
            className="w-full mt-2 flex items-center justify-center px-4 py-2 text-white bg-primary rounded-md disabled:bg-primary/50 hover:bg-primary/90"
          >
              <Icon name="play" className="w-5 h-5 mr-2" />
              Generate Speech
          </button>
      </div>
    </div>
  );
};

interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        {label}
    </button>
);