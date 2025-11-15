
import React from 'react';
import type { Feature, AspectRatio } from './types';
import { Icon } from './components/Icon';

export const FEATURES: Feature[] = [
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    icon: <Icon name="chat" />,
    description: 'Ask questions and get answers from your selected AI.',
    supportedProviders: ['gemini', 'ollama_cloud', 'ollama_self_hosted'],
  },
  {
    id: 'image-generator',
    name: 'Image Generation',
    icon: <Icon name="image" />,
    description: 'Create images from text prompts with aspect ratio control.',
    supportedProviders: ['gemini'],
  },
  {
    id: 'image-editor',
    name: 'Image Editing',
    icon: <Icon name="edit" />,
    description: 'Edit existing images using simple text commands.',
    supportedProviders: ['gemini'],
  },
  {
    id: 'image-analyzer',
    name: 'Image Analysis',
    icon: <Icon name="scan" />,
    description: 'Upload a photo to have the AI analyze its content.',
    supportedProviders: ['gemini', 'ollama_cloud', 'ollama_self_hosted'],
  },
  {
    id: 'video-analyzer',
    name: 'Video Analysis',
    icon: <Icon name="video" />,
    description: 'Extract key information from video files.',
    supportedProviders: ['gemini'],
  },
  {
    id: 'grounded-search',
    name: 'Grounded Search',
    icon: <Icon name="search" />,
    description: 'Get up-to-date info from Google Search & Maps.',
    supportedProviders: ['gemini'],
  },
  {
    id: 'complex-query',
    name: 'Complex Query',
    icon: <Icon name="brain" />,
    description: 'Tackle complex problems with enhanced reasoning.',
    supportedProviders: ['gemini', 'ollama_cloud', 'ollama_self_hosted'],
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    icon: <Icon name="audio" />,
    description: 'Convert text into natural-sounding speech.',
    supportedProviders: ['gemini'],
  },
  {
    id: 'audio-transcription',
    name: 'Audio Transcription',
    icon: <Icon name="mic" />,
    description: 'Transcribe spoken words into text in real-time.',
    supportedProviders: ['gemini'],
  },
];

export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
