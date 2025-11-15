
import type { ReactNode } from 'react';

export type ProviderState = 'gemini' | 'ollama_cloud' | 'ollama_self_hosted';

export interface Settings {
  provider: ProviderState;
  ollamaCloudKey: string;
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