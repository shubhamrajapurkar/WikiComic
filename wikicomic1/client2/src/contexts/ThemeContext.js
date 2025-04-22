import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme style configurations
export const themeStyles = {
  dark: {
    background: 'bg-gray-900',
    text: 'text-white',
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    secondary: 'bg-gray-700',
    accent: 'text-indigo-400',
    fontFamily: '',
  },
  manga: {
    background: 'bg-gray-900',
    backgroundImage: 'bg-manga-pattern',
    text: 'text-white',
    primary: 'bg-purple-600 hover:bg-purple-700',
    secondary: 'bg-gray-800',
    accent: 'text-purple-400',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  western: {
    background: 'bg-amber-900',
    backgroundImage: 'bg-western-pattern',
    text: 'text-amber-100',
    primary: 'bg-red-700 hover:bg-red-800',
    secondary: 'bg-amber-800',
    accent: 'text-yellow-500',
    fontFamily: "'Playfair Display', serif",
  },
  minimalist: {
    background: 'bg-gray-800',
    backgroundImage: 'bg-minimalist-pattern',
    text: 'text-gray-200',
    primary: 'bg-gray-600 hover:bg-gray-700',
    secondary: 'bg-gray-700',
    accent: 'text-gray-400',
    fontFamily: "'Inter', sans-serif",
  }
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [comicStyle, setComicStyle] = useState('Manga');

  // Update theme based on comic style
  useEffect(() => {
    switch(comicStyle) {
      case 'Manga':
        setCurrentTheme('manga');
        break;
      case 'Western':
        setCurrentTheme('western');
        break;
      case 'Minimalist':
        setCurrentTheme('minimalist');
        break;
      default:
        setCurrentTheme('dark');
    }
  }, [comicStyle]);

  // Add Google Fonts dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter&family=Noto+Sans+JP&family=Playfair+Display&family=Roboto&display=swap';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Apply font family to body
  useEffect(() => {
    const fontFamily = themeStyles[currentTheme].fontFamily;
    if (fontFamily) {
      document.body.style.fontFamily = fontFamily;
    } else {
      document.body.style.fontFamily = '';
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setCurrentTheme, 
      comicStyle, 
      setComicStyle, 
      themeStyles: themeStyles[currentTheme] 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext); 