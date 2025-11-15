
import React from 'react';
import type { Feature, AspectRatio } from './types';
import { Icon } from './components/Icon';

export const FEATURES: Feature[] = [
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    icon: <Icon name="chat" />,
    description: 'Ask questions and get answers from Gemini.'
  },
  {
    id: 'image-generator',
    name: 'Image Generation',
    icon: <Icon name="image" />,
    description: 'Create images from text prompts with aspect ratio control.'
  },
  {
    id: 'image-editor',
    name: 'Image Editing',
    icon: <Icon name="edit" />,
    description: 'Edit existing images using simple text commands.'
  },
  {
    id: 'image-analyzer',
    name: 'Image Analysis',
    icon: <Icon name="scan" />,
    description: 'Upload a photo to have Gemini analyze its content.'
  },
  {
    id: 'video-analyzer',
    name: 'Video Analysis',
    icon: <Icon name="video" />,
    description: 'Extract key information from video files.'
  },
  {
    id: 'grounded-search',
    name: 'Grounded Search',
    icon: <Icon name="search" />,
    description: 'Get up-to-date info from Google Search & Maps.'
  },
  {
    id: 'complex-query',
    name: 'Complex Query',
    icon: <Icon name="brain" />,
    description: 'Tackle complex problems with enhanced thinking.'
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    icon: <Icon name="audio" />,
    description: 'Convert text into natural-sounding speech.'
  },
  {
    id: 'audio-transcription',
    name: 'Audio Transcription',
    icon: <Icon name="mic" />,
    description: 'Transcribe spoken words into text in real-time.'
  },
];

export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
