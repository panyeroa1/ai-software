import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createLiveSession } from '../../services/aiService';
import { Icon } from '../../components/Icon';
import type { LiveServerMessage } from '@google/genai';
import { useSettings } from '../../context/SettingsContext';
import { createBlob } from '../../utils/audio';

export const AudioTranscription: React.FC = () => {
    const { settings } = useSettings();
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const sessionPromiseRef = useRef<ReturnType<typeof createLiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const stopRecording = useCallback(() => {
        setIsRecording(false);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
    }, []);

    const startRecording = async () => {
        setIsRecording(true);
        setError(null);
        setTranscription('');

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            audioContextRef.current = new (window.AudioContext)({ sampleRate: 16000 });
            
            const callbacks = {
                onopen: () => {
                    if (!audioContextRef.current || !streamRef.current) return;
                    
                    sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    
                    sourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current.destination);
                },
                onmessage: (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setTranscription(prev => prev + text);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setError('An error occurred during transcription.');
                    stopRecording();
                },
                onclose: () => {
                    // console.log('Live session closed.');
                },
            };

            sessionPromiseRef.current = createLiveSession(callbacks, settings);

        } catch (err: any) {
            console.error('Failed to start recording:', err);
            setError(`Could not access microphone: ${err.message}`);
            setIsRecording(false);
        }
    };
    
    // Cleanup on component unmount
    useEffect(() => {
      return () => {
        stopRecording();
      };
    }, [stopRecording]);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="p-4 bg-light dark:bg-secondary rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Audio Transcription</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click the microphone to start transcribing your speech in real-time.</p>
            </div>
            
            <div className="flex-1 p-4 bg-light dark:bg-secondary rounded-lg shadow overflow-y-auto">
                {error && <p className="text-red-500">{error}</p>}
                <p className="whitespace-pre-wrap">{transcription || (isRecording ? "Listening..." : "Transcription will appear here.")}</p>
            </div>
            
            <div className="p-4 flex items-center justify-center">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                        isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                    }`}
                >
                    <Icon name={isRecording ? 'stop' : 'mic'} className="w-10 h-10 text-white" />
                </button>
            </div>
        </div>
    );
};