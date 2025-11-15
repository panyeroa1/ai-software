
import React, { useState, useEffect } from 'react';
import { generateSpeech } from '../../services/geminiService';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';

// Base64 decoding function for audio
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Custom PCM audio decoder
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('Hello! I am Gemini. It is a pleasure to meet you.');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContext = new (window.AudioContext)({ sampleRate: 24000 });

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    setIsLoading(true);
    setError(null);
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
    }

    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, audioContext);
        
        // Convert AudioBuffer to WAV blob
        const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);

      } else {
        throw new Error('No audio data received.');
      }
    } catch (err) {
      console.error('TTS failed:', err);
      setError('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert AudioBuffer to a WAV file blob
  const bufferToWave = (abuffer: AudioBuffer, len: number) => {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit
    
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Text to Speech</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter text to generate natural-sounding speech.</p>
      </div>

      <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col items-center justify-center">
        {isLoading ? (
          <Spinner text="Generating audio..." size="lg" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : audioUrl ? (
          <audio controls src={audioUrl} className="w-full max-w-md" />
        ) : (
          <p className="text-gray-400">Your generated audio will appear here.</p>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <PromptInput
          value={text}
          onChange={setText}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="Enter text to convert to speech..."
        />
      </div>
    </div>
  );
};
