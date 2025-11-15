
import React, { useState } from 'react';
import type { Feature } from '../types';
import { Icon } from './Icon';

interface SidebarProps {
  features: Feature[];
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ features, activeFeature, setActiveFeature }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <Icon name="spark" className="mr-2 text-primary" />
              Gemini Suite
            </span>
            <button
                className="md:hidden text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                onClick={() => setIsOpen(false)}
            >
                <Icon name="close" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => {
                  setActiveFeature(feature);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                  activeFeature.id === feature.id
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{feature.icon}</span>
                {feature.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
       <button
        className="fixed top-4 left-4 z-20 md:hidden p-2 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        onClick={() => setIsOpen(true)}
      >
        <Icon name="menu" />
      </button>
      {isOpen && <div className="fixed inset-0 z-10 bg-black/30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};
