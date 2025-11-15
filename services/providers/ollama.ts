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
        url = settings.ollamaCloudUrl;
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

export const sendMessage = async (message: string, settings: Settings, history: ChatHistory, systemPrompt?: string): Promise<string> => {
    const { url, headers } = getOllamaConfig(settings);
    const endpoint = new URL('/api/chat', url).toString();

    const messages = formatHistory(history);
    
    const body: {
        model: string;
        messages: OllamaMessage[];
        stream: boolean;
        system?: string;
    } = {
        model: settings.ollamaModel || 'llama3',
        messages: messages,
        stream: false,
    };

    if (systemPrompt) {
        body.system = systemPrompt;
    }

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

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result is "data:audio/wav;base64,...." - we only want the part after the comma
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateSpeech = async (text: string, settings: Settings, audioFormat: 'wav' | 'mp3' = 'wav'): Promise<string | null> => {
    if (!settings.ollamaTtsUrl) {
        throw new Error('Ollama TTS URL is not configured in settings.');
    }

    const url = new URL(settings.ollamaTtsUrl);
    url.searchParams.append('text', text);
    url.searchParams.append('format', audioFormat);

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS server error (${response.status}): ${errorText}`);
    }

    const audioBlob = await response.blob();
    const base64Audio = await blobToBase64(audioBlob);

    return base64Audio;
};

export const listModels = async (settings: Settings): Promise<string[]> => {
    const { url, headers } = getOllamaConfig(settings);
    
    // Silently return if URL is incomplete to avoid errors while user is typing.
    if (!url || !url.startsWith('http')) {
        return [];
    }

    try {
        const endpoint = new URL('/api/tags', url).toString();

        // For the cloud provider, a "Failed to fetch" error often indicates a CORS issue,
        // especially when custom headers like 'Authorization' are sent, which triggers a
        // preflight OPTIONS request. The documentation for this specific endpoint (`/api/tags`)
        // does not show any required headers. By sending a "simple" request without them,
        // we can avoid the preflight and potentially bypass the CORS issue.
        // Other endpoints like `/api/chat` will still use the headers as needed.
        const requestHeaders = settings.provider === 'ollama_cloud' ? undefined : headers;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: requestHeaders,
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => `(could not read response body)`);
            throw new Error(`Server responded with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        if (data && data.models && Array.isArray(data.models)) {
            return data.models.map((model: any) => model.name).sort();
        }
        return [];
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        
        if (error instanceof TypeError) {
             if (error.message.includes('Invalid URL')) {
                 throw new Error('The Ollama URL is invalid. Please check the format.');
            }
            // Catch fetch's generic network error and provide a more helpful message.
            if (error.message.includes('Failed to fetch')) {
                throw new Error("Could not connect to the Ollama server. Please verify the URL, ensure the server is running, and check for CORS issues.");
            }
        }
        
        // Re-throw if it's a custom error we already created, or wrap it.
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred while fetching models.');
    }
};