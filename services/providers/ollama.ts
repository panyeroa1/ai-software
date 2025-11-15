
import type { Settings } from '../../types';

type OllamaMessage = {
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
};

type ChatHistory = { role: 'user' | 'assistant' | 'model'; parts: { text: string }[] }[];

const getOllamaConfig = (settings: Settings): { url: string; headers: Record<string, string> } => {
    let url: string;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (settings.provider === 'ollama_self_hosted') {
        url = settings.ollamaSelfHostedUrl;
    } else if (settings.provider === 'ollama_cloud') {
        // This is a hypothetical endpoint. Replace with the actual cloud URL if available.
        url = 'https://api.ollama.com'; 
        if(settings.ollamaCloudKey) {
            headers['Authorization'] = `Bearer ${settings.ollamaCloudKey}`;
        }
    } else {
        throw new Error('Invalid Ollama provider configuration');
    }

    return { url, headers };
};

const formatHistory = (history: ChatHistory): OllamaMessage[] => {
    return history.map(msg => ({
        // Ollama uses 'assistant' for bot messages
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts[0].text,
    }));
};

export const sendMessage = async (message: string, settings: Settings, history: ChatHistory): Promise<string> => {
    const { url, headers } = getOllamaConfig(settings);
    const endpoint = new URL('/api/chat', url).toString();

    const messages = formatHistory(history);
    
    const body = {
        model: settings.ollamaModel || 'llama3', // Default to a text model
        messages: messages,
        stream: false,
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.message.content;
};

export const analyzeImage = async (prompt: string, image: { data: string; mimeType: string }, settings: Settings): Promise<string> => {
    const { url, headers } = getOllamaConfig(settings);
    const endpoint = new URL('/api/chat', url).toString();
    
    const messages: OllamaMessage[] = [
        {
            role: 'user',
            content: prompt,
            images: [image.data] // Pass base64 data directly
        }
    ];

    const body = {
        model: settings.ollamaModel || 'llava:latest', // Default to a vision model
        messages: messages,
        stream: false
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.message.content;
};
