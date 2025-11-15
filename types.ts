
import type { ReactNode } from 'react';

export interface Feature {
  id: string;
  name: string;
  // FIX: Use ReactNode type which is now imported.
  icon: ReactNode;
  description: string;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
