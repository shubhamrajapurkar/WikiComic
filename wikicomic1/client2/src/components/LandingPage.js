import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
// Import the background images
import mangaBg from '../assets/images/mangabg.jpg';
import retroBg from '../assets/images/retrobg.jpg';
import sleekBg from '../assets/images/sleek.jpeg';

// API base URL
const API_BASE_URL = 'http://localhost:8000/comic';

const LandingPage = () => {
  const [topic, setTopic] = useState('');
  const [complexityLevel, setComplexityLevel] = useState('Elementary');
  const [comicStyle, setComicStyle] = useState('Manga');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [comicShake, setComicShake] = useState(false);
  const [userPoints, setUserPoints] = useState(350);
  const [userLevel, setUserLevel] = useState(4);
  const [recentTopics, setRecentTopics] = useState([]);
  const [complexity, setComplexity] = useState(50);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();
  const { setComicStyle: setGlobalComicStyle, themeStyles, currentTheme } = useTheme();

  // Update global comic style when local state changes
  useEffect(() => {
    setGlobalComicStyle(comicStyle);
  }, [comicStyle, setGlobalComicStyle]);

  // Function to search Wikipedia
  const handleSearch = async (searchTerm) => {
    try {
      setIsSearching(true);
      const response = await axios.post(`${API_BASE_URL}/api/search/`, {
        query: searchTerm
      });
      
      if (response.data.results) {
        setSearchResults(response.data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search Wikipedia');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (topic && topic.length >= 3) {
        handleSearch(topic);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [topic]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First API call to generate the comic
      const generateResponse = await axios.post(`${API_BASE_URL}/api/generate/`, {
        title: topic,
        target_length: complexityLevel.toLowerCase(),
        comic_style: comicStyle
      });

      console.log('Comic generation started:', generateResponse.data);
      
      // Get the request_id from the response
      const requestId = generateResponse.data.request_id;
      
      // Poll the status endpoint until the comic is ready
      const checkStatus = async () => {
        const statusResponse = await axios.get(`${API_BASE_URL}/api/status/${requestId}/`);
        return statusResponse.data;
      };

      // Poll every 2 seconds until the comic is ready
      const pollStatus = async () => {
        try {
          const status = await checkStatus();
          console.log('Current status:', status);

          if (status.status === 'COMPLETED') {
            // Comic is ready, get the comic data
            const comicResponse = await axios.get(`${API_BASE_URL}/api/comic/${status.comic_id}/`);
            console.log('Comic data received:', comicResponse.data);
            
            // Store comic data in sessionStorage
            sessionStorage.setItem('comicData', JSON.stringify(comicResponse.data));
            
            // Add to recent topics
            if (topic && !recentTopics.includes(topic)) {
              setRecentTopics(prev => [topic, ...prev.slice(0, 3)]);
            }
            
            // Add points for successful generation
            setUserPoints(prev => prev + 25);
            
            setIsLoading(false);
            // Navigate to comic viewer
            navigate('/comic');
          } else if (status.status === 'ERROR') {
            setError(status.message || 'Error generating comic');
            setIsLoading(false);
          } else {
            // Still processing, check again in 2 seconds
            setTimeout(pollStatus, 2000);
          }
        } catch (error) {
          console.error('Error checking status:', error);
          setError('Error checking comic status');
          setIsLoading(false);
        }
      };

      // Start polling
      pollStatus();
      
    } catch (err) {
      console.error('Error generating comic:', err);
      setError(err.response?.data?.error || 'Failed to generate comic. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle selecting a search result
  const handleSelectTopic = (selectedTopic) => {
    setTopic(typeof selectedTopic === 'string' ? selectedTopic : selectedTopic.title || '');
    setSearchResults([]); // Clear search results
    // Add points for interaction
    setUserPoints(prev => prev + 5);
  };

  // Comic style options with playful names and descriptions
  const styleOptions = [
    {
      id: 'Manga',
      name: 'MANGA MADNESS',
      color: '#536DFE',
      bannerColor: '#3D5AFE',
      description: 'Big eyes & epic expressions!',
      level: 1,
      bgImage: mangaBg, // Use the imported manga background image
      textClass: 'font-manga'
    },
    {
      id: 'Western',
      name: 'RETRO COMICS',
      color: '#FF9800',
      bannerColor: '#F57C00',
      description: 'Old-school patterns & nostalgia',
      level: 2,
      bgImage: retroBg, // Use the imported retro background image
      textClass: 'font-western'
    },
    {
      id: 'Minimalist',
      name: 'SLEEK STYLE',
      color: '#607D8B',
      bannerColor: '#455A64',
      description: 'Clean, modern & minimal design',
      level: 3,
      bgImage: sleekBg, // Use the imported sleek background image
      textClass: 'font-minimalist'
    },
    {
      id: 'Cartoon',
      name: 'WACKY TOONS',
      color: '#8BC34A',
      bannerColor: '#689F38',
      description: 'Looney & exaggerated fun style',
      level: 4,
      bgClass: 'bg-manga-pattern bg-cover bg-center',
      textClass: 'font-manga',
      locked: true
    },
    {
      id: 'Noir',
      name: 'DARK NOIR',
      color: '#607D8B',
      bannerColor: '#455A64',
      description: 'Shadows & mystery vibes',
      level: 5,
      bgClass: 'bg-western-pattern bg-cover bg-center',
      textClass: 'font-western',
      locked: true
    }
  ];
  
  // Get the current style object
  const currentStyleObj = styleOptions.find(style => style.id === comicStyle) || styleOptions[0];

  // Handle style selection
  const handleStyleSelection = (style) => {
    if (style.locked) {
      setComicShake(true);
      setTimeout(() => setComicShake(false), 500);
      return;
    }
    
    setComicStyle(style.id);
    setShowStylePanel(false);
    
    // Add points for interaction (gamification)
    setUserPoints(prev => prev + 5);
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Dynamic background based on selected style - full opacity */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: currentStyleObj.bgImage ? `url(${currentStyleObj.bgImage})` : '',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'none',
        }}
      ></div>
      
      {/* Remove overlay pattern div and replace with a transparent div */}
      <div className="absolute inset-0 z-0 bg-transparent"></div>
      
      <div className="relative z-10">
        {/* Comic Book Header */}
        <header className="relative overflow-hidden" style={{ 
          backgroundColor: currentStyleObj.bannerColor || '#3D5AFE',
          borderBottom: '3px solid black',
          boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
        }}>
          {/* Comic dots overlay - keeping it for the header */}
          <div className="comic-dots absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '10px 10px'
          }}></div>
          
          <div className="container mx-auto py-4 px-6 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="comic-logo text-white text-3xl font-extrabold tracking-tight flex items-center">
                  <span className="transform -rotate-6 inline-block">W</span>
                  <span>iki</span>
                  <span className="transform rotate-6 inline-block">C</span>
                  <span>omics!</span>
                  <svg className="ml-1 text-yellow-300" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="yellow" stroke="currentColor" />
                  </svg>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-300 border-2 border-black rounded-full px-3 py-1 text-black font-bold shadow-lg transform hover:scale-105 transition-transform" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                  <div className="flex items-center">
                    <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="orange" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="orange" stroke="currentColor" />
                    </svg>
                    <span>{userPoints} POINTS</span>
                  </div>
                </div>
                
                <div className="bg-purple-500 border-2 border-black rounded-full px-3 py-1 text-white font-bold shadow-lg" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                  <div className="flex items-center">
                    <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="gold" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" fill="gold" stroke="currentColor" />
                      <path d="M8 14h8v7l-4-3-4 3v-7z" fill="gold" stroke="currentColor" />
                    </svg>
                    <span>LEVEL {userLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comic style explosion lines */}
          <div className="absolute left-0 top-0 w-40 h-40">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute left-0 top-0 bg-yellow-300 h-1" style={{
                width: '100px',
                transformOrigin: '0 0',
                transform: `rotate(${i * 45}deg)`,
                opacity: 0.7
              }}></div>
            ))}
          </div>
          
          <div className="absolute right-0 bottom-0 w-40 h-40">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute right-0 bottom-0 bg-yellow-300 h-1" style={{
                width: '100px',
                transformOrigin: '100% 100%',
                transform: `rotate(${i * 45}deg)`,
                opacity: 0.7
              }}></div>
            ))}
          </div>
        </header>
        
        {/* Main Content */}
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Comic Book Panel */}
            <div 
              className={`bg-white border-4 border-black rounded-lg p-6 mb-8 relative transform ${comicShake ? 'animate-wiggle' : ''}`} 
              style={{ 
                boxShadow: '8px 8px 0 rgba(0,0,0,0.8)',
                borderRadius: '20px / 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Remove the subtle background image */}
              
              {/* Remove white overlay */}
              
              <div className="relative z-10">
                <h1 className="text-center mb-6">
                  <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-3xl md:text-4xl font-extrabold py-2 px-6 rounded-lg border-2 border-black transform -rotate-2" style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}>
                    CREATE YOUR COMIC!
                  </span>
                </h1>
                
                <form onSubmit={handleSubmit}>
                  {/* Topic Input */}
                  <div className="mb-6">
                    <label className="block text-xl font-bold mb-2 text-center">
                      WHAT DO YOU WANT TO LEARN ABOUT?
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a Wikipedia topic..."
                        className="w-full py-3 px-4 rounded-lg border-3 border-black bg-yellow-50 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-yellow-300"
                        style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}
                        required
                      />
                      
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-black rounded-lg shadow-lg">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              onClick={() => handleSelectTopic(result)}
                              className="p-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-bold">{result}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent topics */}
                    {recentTopics.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 text-sm font-bold text-purple-600">
                          <span>YOUR PREVIOUS QUESTS:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {recentTopics.map((recentTopic) => (
                            <button
                              key={recentTopic}
                              type="button"
                              onClick={() => setTopic(recentTopic)}
                              className="px-3 py-1 rounded-full bg-purple-100 border-2 border-purple-500 text-purple-800 font-bold hover:bg-purple-200 hover:border-purple-600 transition transform hover:-translate-y-1 hover:scale-105"
                            >
                              {recentTopic}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Comic Style Selection */}
                  <div className="mb-6">
                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => setShowStylePanel(!showStylePanel)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg border-2 border-black transform hover:scale-105 transition shadow-lg"
                        style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}
                      >
                        SELECT YOUR STYLE!
                      </button>
                    </div>
                    
                    {showStylePanel && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                        {styleOptions.map((style, index) => (
                          <div 
                            key={style.id} 
                            onClick={() => handleStyleSelection(style)}
                            className={`cursor-pointer transform transition hover:scale-105 relative ${style.locked ? 'opacity-75' : ''}`}
                          >
                            <div 
                              className="h-40 rounded-lg border-3 border-black flex items-center justify-center relative overflow-hidden"
                              style={{ 
                                backgroundColor: style.color,
                                boxShadow: comicStyle === style.id ? '0 0 0 4px black, 0 0 0 8px yellow' : '4px 4px 0 rgba(0,0,0,0.8)'
                              }}
                            >
                              {/* Comic style background - full opacity */}
                              <div className={`absolute inset-0 ${style.bgClass || ''}`} style={{
                                backgroundImage: style.bgImage ? `url(${style.bgImage})` : '',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                transition: 'all 0.3s ease'
                              }}></div>
                              
                              {style.locked && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                                  <div className="bg-yellow-400 text-black text-sm font-bold py-1 px-3 rotate-12 border-2 border-black" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>
                                    UNLOCK AT LVL {style.level}
                                  </div>
                                </div>
                              )}
                              
                              {/* Style name overlay - stronger contrast */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-2 text-center font-bold z-10">
                                {style.name}
                              </div>
                            </div>
                            <div className="mt-2 bg-white border-2 border-black rounded px-2 py-1 text-center font-bold text-sm relative" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                              {style.name}
                              
                              {/* Level requirement badge */}
                              <div 
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 border-2 border-black text-white text-xs flex items-center justify-center font-bold"
                                style={{ boxShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}
                              >
                                {style.level}
                              </div>
                            </div>
                            <div className="text-xs text-center mt-1 bg-white bg-opacity-80 px-2 py-1 rounded">{style.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Selected style display */}
                    {!showStylePanel && (
                      <div className="flex items-center justify-center mt-4">
                        <div 
                          className="h-16 w-64 px-4 py-2 rounded-lg border-3 border-black flex items-center justify-center gap-2 relative overflow-hidden"
                          style={{ 
                            backgroundColor: currentStyleObj.color,
                            boxShadow: '4px 4px 0 rgba(0,0,0,0.8)'
                          }}
                        >
                          {/* Background image - full opacity */}
                          <div className="absolute inset-0" style={{
                            backgroundImage: currentStyleObj.bgImage ? `url(${currentStyleObj.bgImage})` : '',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}></div>
                          
                          {/* Add dark overlay for better text contrast */}
                          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                          
                          {/* Overlay content */}
                          <div className="relative z-10 flex items-center justify-center w-full">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="white" stroke="white" />
                            </svg>
                            <span className="text-white font-bold ml-2">{currentStyleObj.name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Complexity Slider */}
                  <div className="mb-8">
                    <div className="text-center mb-2">
                      <span className="inline-block bg-orange-500 text-white text-xl font-bold py-1 px-4 rounded-full border-2 border-black" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                        BRAIN POWER LEVEL
                      </span>
                    </div>
                    <div className="mt-4 px-4">
                      <div 
                        className="w-full h-12 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full border-2 border-black relative"
                        style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}
                      >
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={complexity}
                          onChange={(e) => {
                            setComplexity(parseInt(e.target.value));
                            // Set complexity level based on slider value
                            if (e.target.value < 33) {
                              setComplexityLevel('Elementary');
                            } else if (e.target.value < 66) {
                              setComplexityLevel('High School');
                            } else {
                              setComplexityLevel('College');
                            }
                          }}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                        />
                        
                        {/* Custom slider handle */}
                        <div 
                          className="absolute top-1/2 transform -translate-y-1/2 w-8 h-14 bg-white border-2 border-black rounded-full cursor-grab"
                          style={{ 
                            left: `calc(${complexity}% - 16px)`, 
                            boxShadow: '2px 2px 0 rgba(0,0,0,0.8)',
                            transition: 'left 0.1s ease-out'
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1 h-8 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                        
                        {/* Level markers */}
                        <div className="absolute -bottom-10 left-0 right-0 flex justify-between px-4 text-sm font-bold">
                          <div className="flex flex-col items-center">
                            <div className="w-1 h-4 bg-black"></div>
                            <span>ELEMENTARY</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-1 h-4 bg-black"></div>
                            <span>HIGH SCHOOL</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-1 h-4 bg-black"></div>
                            <span>COLLEGE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="text-center mt-12">
                    <button
                      type="submit"
                      disabled={isLoading || !topic}
                      className={`px-10 py-4 bg-gradient-to-r ${
                        isLoading || !topic
                          ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                          : 'from-green-500 to-emerald-600 hover:scale-105'
                      } text-white text-2xl font-extrabold rounded-lg border-3 border-black transform transition relative overflow-hidden shadow-lg`}
                      style={{ boxShadow: '5px 5px 0 rgba(0,0,0,0.8)' }}
                    >
                      <div className="relative flex items-center justify-center">
                        {isLoading ? (
                          <>
                            CREATING...
                            <div className="ml-2 animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                          </>
                        ) : (
                          <>
                            MAKE MY COMIC!
                            <svg className="ml-2 inline" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="yellow" stroke="white" />
                            </svg>
                          </>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 text-center text-red-600 font-bold bg-red-100 border-2 border-red-400 rounded-lg p-3">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </main>
        
        {/* Comic-style footer */}
        <footer className="mt-12 py-4 bg-blue-800 text-white relative overflow-hidden" style={{ 
          borderTop: '3px solid black'
        }}>
          {/* Comic dots overlay - keeping it for the footer */}
          <div className="comic-dots absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '10px 10px'
          }}></div>
          
          <div className="container mx-auto text-center relative z-10">
            <p className="text-lg font-bold" style={{ 
              fontFamily: 'Comic Sans MS, cursive'
            }}>WIKICOMICS - LEARN IN STYLE!</p>
          </div>
          
          {/* Comic style explosion lines */}
          <div className="absolute left-1/4 bottom-0 w-20 h-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute left-0 bottom-0 bg-yellow-300 h-1" style={{
                width: '20px',
                transformOrigin: '0 100%',
                transform: `rotate(${i * 30}deg)`,
                opacity: 0.7
              }}></div>
            ))}
          </div>
          
          <div className="absolute right-1/4 bottom-0 w-20 h-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute right-0 bottom-0 bg-yellow-300 h-1" style={{
                width: '20px',
                transformOrigin: '100% 100%',
                transform: `rotate(${-i * 30}deg)`,
                opacity: 0.7
              }}></div>
            ))}
          </div>
        </footer>
      </div>
      
      {/* Add keyframes for the wiggle animation */}
      <style jsx="true">{`
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(2deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease;
        }
      `}</style>
    </div>
  );
};

export default LandingPage; 