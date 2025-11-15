import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import type { AspectRatio, SpeechConfig } from '../types';

let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable is not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}


// FIX: Update createChat to accept history and systemInstruction to enable stateful and configurable conversations.
export const createChat = (
  history?: { role: string; parts: { text: string }[] }[],
  systemInstruction?: string
): Chat => {
  return getAi().chats.create({
    model: 'gemini-2.5-flash',
    history,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  return await chat.sendMessage({ message });
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const response = await getAi().models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio,
    },
  });
  return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (prompt: string, image: { data: string; mimeType: string }): Promise<string | null> => {
  const response = await getAi().models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  const firstPart = response.candidates?.[0]?.content?.parts?.[0];
  if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
    return firstPart.inlineData.data;
  }
  return null;
};

export const analyzeImage = async (prompt: string, image: { data: string; mimeType: string }): Promise<string> => {
  const response = await getAi().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: prompt },
      ],
    },
  });
  return response.text;
};

export const analyzeVideoFrames = async (prompt: string, frames: { data: string, mimeType: string }[]): Promise<string> => {
  const imageParts = frames.map(frame => ({
    inlineData: { data: frame.data, mimeType: frame.mimeType }
  }));

  const response = await getAi().models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
          parts: [{text: prompt}, ...imageParts]
      }
  });
  return response.text;
};

export const groundedSearch = async (prompt: string, useMaps: boolean, location?: {latitude: number, longitude: number}): Promise<{text: string, chunks: any[]}> => {
  const tools: any[] = useMaps ? [{googleMaps: {}}] : [{googleSearch: {}}];
  const config: any = { tools };

  if (useMaps && location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: location
      }
    };
  }
  
  const response = await getAi().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config
  });
  
  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const complexQuery = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const response = await getAi().models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: { 
      systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 } 
    }
  });
  return response.text;
};


export const generateSpeech = async (text: string, config: SpeechConfig): Promise<string | null> => {
    let speechConfigPayload: any;

    if (config.mode === 'single') {
        speechConfigPayload = {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: config.voice },
            },
        };
    } else { // multi-speaker
        if (config.speakers.length !== 2) {
            throw new Error("Multi-speaker TTS requires exactly two speakers.");
        }
        speechConfigPayload = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: config.speakers.map(speaker => ({
                    speaker: speaker.name,
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: speaker.voice }
                    }
                }))
            }
        };
    }

    const response = await getAi().models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfigPayload,
        },
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;
};

export const createLiveSession = (
    callbacks: {
        onopen: () => void;
        onmessage: (message: LiveServerMessage) => void;
        onerror: (e: ErrorEvent) => void;
        onclose: (e: CloseEvent) => void;
    },
    systemInstruction?: string
) => {
    return getAi().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction,
        },
    });
};
