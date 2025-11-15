
import React, { useState } from 'react';
import type { Feature } from '../types';
import { Icon } from './Icon';

interface SidebarProps {
  features: Feature[];
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ features, activeFeature, setActiveFeature, onSettingsClick }) => {
  const [isOpen, setIsOpen] = useState(false); // For mobile overlay
  const [isCollapsed, setIsCollapsed] = useState(false); // For desktop collapse

  return (
    <>
      {/* Main Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-30
        h-full flex flex-col
        bg-white dark:bg-gray-800 shadow-lg
        transition-all duration-300 ease-in-out
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex-shrink-0
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>

        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center overflow-hidden">
            <Icon name="spark" className="h-8 w-8 text-primary flex-shrink-0" />
            <span className={`ml-2 text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Gemini Suite
            </span>
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setIsOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {features.map((feature) => (
            <div key={feature.id} className="relative group flex items-center">
              <button
                onClick={() => {
                  setActiveFeature(feature);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${
                  activeFeature.id === feature.id
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={feature.name}
              >
                <span className={`flex-shrink-0 ${!isCollapsed && 'mr-3'}`}>{feature.icon}</span>
                {!isCollapsed && <span>{feature.name}</span>}
              </button>
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900/80 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20 backdrop-blur-sm">
                  {feature.name}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer with Settings and Collapse */}
        <div className="hidden md:flex p-2 border-t border-gray-200 dark:border-gray-700 items-center">
          <button
            onClick={onSettingsClick}
            className="flex-shrink-0 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Open settings"
          >
             <Icon name="settings" />
          </button>
          <div className="flex-grow" />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} />
          </button>
        </div>
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-4 left-4 z-20 md:hidden p-2 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        onClick={() => setIsOpen(true)}
      >
        <Icon name="menu" />
      </button>
      
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 z-10 bg-black/30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
};
