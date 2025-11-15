
import type { ReactNode } from 'react';

export type ProviderState = 'gemini' | 'ollama_cloud' | 'ollama_self_hosted';

export interface Settings {
  provider: ProviderState;
  ollamaCloudKey: string;
  ollamaCloudUrl: string;
  ollamaSelfHostedUrl: string;
  ollamaModel: string;
  ollamaTtsUrl: string;
}

export interface Feature {
  id: string;
  name: string;
  icon: ReactNode;
  description: string;
  supportedProviders: ProviderState[];
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface SingleSpeakerConfig {
  mode: 'single';
  voice: string;
}

export interface MultiSpeakerConfig {
  mode: 'multi';
  speakers: { id: number; name: string; voice: string }[];
}

export type SpeechConfig = SingleSpeakerConfig | MultiSpeakerConfig;
