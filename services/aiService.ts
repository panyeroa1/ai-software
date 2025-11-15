import type { Settings, AspectRatio, SpeechConfig } from '../types';
import * as gemini from './geminiService';
import * as ollama from './providers/ollama';
import type { LiveServerMessage } from '@google/genai';
import { CHATBOT_SYSTEM_PROMPT } from '../constants';

const NOT_SUPPORTED_ERROR = 'This feature is not supported by the selected provider.';

type ChatHistory = { role: 'user' | 'assistant' | 'model'; parts: { text: string }[] }[];

// Chat functions
export const sendMessageToChat = async (message: string, settings: Settings, history: ChatHistory): Promise<string> => {
    switch(settings.provider) {
        case 'gemini': {
             // FIX: Implement stateful chat for Gemini by passing the history.
             // The history from Chatbot.tsx includes the current message.
             // We separate it because Gemini's `createChat` takes history, and `sendMessage` takes the new message.
             const historyWithoutCurrent = history.slice(0, -1);
             
             // Map roles for Gemini: 'assistant' -> 'model', 'user' -> 'user'
             const geminiHistory = historyWithoutCurrent.map(m => ({
                 role: m.role === 'assistant' ? 'model' : 'user',
                 parts: m.parts,
             }));

             const chat = gemini.createChat(geminiHistory, CHATBOT_SYSTEM_PROMPT);
             const response = await gemini.sendMessageToChat(chat, message);
             return response.text;
        }
        case 'ollama_cloud':
        case 'ollama_self_hosted':
            return ollama.sendMessage(message, settings, history, CHATBOT_SYSTEM_PROMPT);
        default:
            throw new Error('Invalid provider selected');
    }
};

// Image generation
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, settings: Settings): Promise<string> => {
    if (settings.provider === 'gemini') {
        return gemini.generateImage(prompt, aspectRatio);
    }
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Image editing
export const editImage = async (prompt: string, image: { data: string; mimeType: string }, settings: Settings): Promise<string | null> => {
     if (settings.provider === 'gemini') {
        return gemini.editImage(prompt, image);
    }
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Image analysis
export const analyzeImage = async (prompt: string, image: { data: string; mimeType: string }, settings: Settings): Promise<string> => {
    switch(settings.provider) {
        case 'gemini':
            return gemini.analyzeImage(prompt, image);
        case 'ollama_cloud':
        case 'ollama_self_hosted':
            return ollama.analyzeImage(prompt, image, settings);
        default:
            throw new Error('Invalid provider selected');
    }
}

// Video analysis
export const analyzeVideoFrames = async (prompt: string, frames: { data: string, mimeType: string }[], settings: Settings): Promise<string> => {
     if (settings.provider === 'gemini') {
        return gemini.analyzeVideoFrames(prompt, frames);
    }
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Grounded Search
export const groundedSearch = async (prompt: string, useMaps: boolean, settings: Settings, location?: {latitude: number, longitude: number}): Promise<{text: string, chunks: any[]}> => {
     if (settings.provider === 'gemini') {
        return gemini.groundedSearch(prompt, useMaps, location);
    }
    throw new Error(NOT_SUPPORTED_ERROR);
}

// Complex Query
export const complexQuery = async (prompt: string, settings: Settings): Promise<string> => {
     switch(settings.provider) {
        case 'gemini':
            return gemini.complexQuery(prompt, CHATBOT_SYSTEM_PROMPT);
        case 'ollama_cloud':
        case 'ollama_self_hosted':
            // Ollama doesn't have a specific "thinking budget" but we can route it to the chat endpoint
            return ollama.sendMessage(prompt, settings, [{role: 'user', parts: [{text: prompt}]}], CHATBOT_SYSTEM_PROMPT);
        default:
            throw new Error('Invalid provider selected');
    }
}

// Text to Speech
export const generateSpeech = async (text: string, settings: Settings, config: SpeechConfig, audioFormat: 'wav' | 'mp3' = 'wav'): Promise<string | null> => {
    switch(settings.provider) {
        case 'gemini':
            return gemini.generateSpeech(text, config);
        case 'ollama_self_hosted':
            // Ollama provider does not support multi-speaker, so we ignore the config.
            return ollama.generateSpeech(text, settings, audioFormat);
        default:
             throw new Error(NOT_SUPPORTED_ERROR);
    }
}

// Audio Transcription & Voice Assistant
export const createLiveSession = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}, settings: Settings) => {
     if (settings.provider === 'gemini') {
        return gemini.createLiveSession(callbacks, CHATBOT_SYSTEM_PROMPT);
    }
    // Live sessions are very specific to the provider's SDK, so we throw here for Ollama.
    return Promise.reject(new Error(NOT_SUPPORTED_ERROR));
};

// Ollama specific functions
export const listOllamaModels = (settings: Settings): Promise<string[]> => {
    if (settings.provider.startsWith('ollama')) {
        return ollama.listModels(settings);
    }
    return Promise.resolve([]);
};