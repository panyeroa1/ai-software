import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createLiveSession } from '../../services/aiService';
import { Icon } from '../../components/Icon';
import type { LiveServerMessage } from '@google/genai';
import { useSettings } from '../../context/SettingsContext';
import { createBlob, decode, decodeAudioData } from '../../utils/audio';

interface Transcript {
    source: 'user' | 'bot';
    text: string;
    isFinal: boolean;
}

export const VoiceAssistant: React.FC = () => {
    const { settings } = useSettings();
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Refs for managing Web Audio API and Live session
    const sessionPromiseRef = useRef<ReturnType<typeof createLiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopSession = useCallback(() => {
        setIsSessionActive(false);

        // Stop microphone stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Disconnect and close input audio context
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (sourceRef.current) sourceRef.current.disconnect();
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }

        // Stop any playing audio and close output audio context
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }

        // Close the Gemini Live session
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
        
        // Finalize any partial transcripts
        setTranscripts(prev => prev.map(t => ({ ...t, isFinal: true })));

    }, []);

    const startSession = async () => {
        setIsSessionActive(true);
        setError(null);
        setTranscripts([]);
        nextStartTimeRef.current = 0;

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 24000 });

            const callbacks = {
                onopen: () => {
                    if (!inputAudioContextRef.current || !streamRef.current) return;
                    
                    sourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
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
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    handleTranscription(message);
                    await handleAudio(message);
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setError('An error occurred during the session.');
                    stopSession();
                },
                onclose: () => {
                   // console.log('Live session closed.');
                },
            };

            sessionPromiseRef.current = createLiveSession(callbacks, settings);

        } catch (err: any) {
            console.error('Failed to start session:', err);
            setError(`Could not access microphone: ${err.message}`);
            setIsSessionActive(false);
        }
    };

    const handleTranscription = (message: LiveServerMessage) => {
        let isNewTurn = false;
        
        if(message.serverContent?.turnComplete) {
            isNewTurn = true;
        }

        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.source === 'user' && !last.isFinal) {
                    const newTranscripts = [...prev];
                    newTranscripts[prev.length - 1] = { ...last, text: last.text + text, isFinal: isNewTurn };
                    return newTranscripts;
                }
                return [...prev, { source: 'user', text, isFinal: isNewTurn }];
            });
        }
        
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
             setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if(last?.source === 'user' && !last.isFinal) {
                    // Finalize user's turn before bot starts talking
                    last.isFinal = true;
                }
                if (last?.source === 'bot' && !last.isFinal) {
                    const newTranscripts = [...prev];
                    newTranscripts[prev.length - 1] = { ...last, text: last.text + text, isFinal: isNewTurn };
                    return newTranscripts;
                }
                return [...prev, { source: 'bot', text, isFinal: isNewTurn }];
            });
        }
    };
    
    const handleAudio = async (message: LiveServerMessage) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        const outputCtx = outputAudioContextRef.current;
        
        if (audioData && outputCtx) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            
            const decodedBytes = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedBytes, outputCtx);
            
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }
        
        if (message.serverContent?.interrupted) {
            audioSourcesRef.current.forEach(source => source.stop());
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    };
    
    useEffect(() => {
        return () => stopSession();
    }, [stopSession]);

    return (
        <div className="flex flex-col h-full bg-secondary rounded-lg shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Voice Assistant</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col">
                <div className="flex-grow space-y-4">
                    {transcripts.length === 0 && !isSessionActive &&
                        <div className="text-center text-gray-400 pt-16">
                            <p>Press the button to start the conversation.</p>
                        </div>
                    }
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex items-start gap-3 ${t.source === 'user' ? 'justify-end' : ''}`}>
                             {t.source === 'bot' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white"><Icon name="spark" className="w-5 h-5"/></div>}
                             <p className={`px-4 py-2 rounded-lg max-w-lg ${ t.source === 'user' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-200' } ${t.isFinal ? 'opacity-100' : 'opacity-60'}`}>
                                {t.text}
                             </p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-4 flex flex-col items-center justify-center gap-4">
                {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
                <button
                    onClick={isSessionActive ? stopSession : startSession}
                    className="relative w-24 h-24 rounded-full flex items-center justify-center bg-primary transition-all duration-300 ease-in-out hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/50"
                >
                    {isSessionActive && <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping"></div>}
                    <Icon name={isSessionActive ? 'stop' : 'mic'} className="w-12 h-12 text-white" />
                </button>
            </div>
        </div>
    );
};
