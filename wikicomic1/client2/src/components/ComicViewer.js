import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import QuizComponent from './QuizComponent';

const ComicViewer = () => {
  const [comicData, setComicData] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);
  const [userPoints, setUserPoints] = useState(375);
  const [showQuiz, setShowQuiz] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setComicStyle, themeStyles, currentTheme } = useTheme();

  useEffect(() => {
    // Load comic data from sessionStorage
    const storedData = sessionStorage.getItem('comicData');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        // Transform the Django response data into the format we need
        const transformedData = {
          topic: parsedData.title || "Unknown Topic",
          storyline: parsedData.storyline || "",
          status: parsedData.status || "completed",
          pages: parsedData.scenes ? parsedData.scenes.map(scene => ({
            imageUrl: scene.image_url,
            keyPoints: scene.prompt ? scene.prompt.split('\n').filter(point => point.trim()) : [],
            sceneNumber: scene.scene_number
          })).sort((a, b) => a.sceneNumber - b.sceneNumber) : []
        };

        console.log('Transformed comic data:', transformedData);
        
        if (transformedData.pages.length === 0) {
          setError('No comic pages available. Please try generating the comic again.');
          return;
        }

        setComicData(transformedData);
        setComicStyle(transformedData.comicStyle);
        setError(null);
      } catch (err) {
        console.error('Error parsing comic data:', err);
        setError('Error loading comic data. Please try generating the comic again.');
      }
    } else {
      setError('No comic data found. Please generate a comic first.');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [navigate, setComicStyle]);

  // Handle page navigation with transition effect
  const changePage = (newIndex) => {
    if (!comicData || !comicData.pages) return;
    
    if (newIndex >= 0 && newIndex < comicData.pages.length && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPageIndex(newIndex);
        setIsTransitioning(false);
        
        // Add points for reading (gamification)
        setUserPoints(prev => prev + 5);
        
        // Show achievement when reaching the last page
        if (newIndex === comicData.pages.length - 1) {
          setTimeout(() => {
            setAchievementUnlocked(true);
            setUserPoints(prev => prev + 50);
          }, 500);
        }
      }, 300);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < comicData.pages.length - 1) {
      changePage(currentPageIndex + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      changePage(currentPageIndex - 1);
    }
  };

  // Toggle key points visibility
  const toggleKeyPoints = () => {
    setShowKeyPoints(!showKeyPoints);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'i' || e.key === 'I') {
        toggleKeyPoints();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPageIndex, comicData]);

  // Get style classes based on current theme
  const getThemeClasses = () => {
    switch(currentTheme) {
      case 'manga':
        return { 
          overlayColor: 'bg-manga-blue/60', 
          panelStyle: 'shadow-xl border-3px border-purple-900/30 bg-polka-dots',
          pageStyle: 'manga-text font-comic',
          buttonStyle: 'bg-manga-blue hover:bg-manga-blue/80 animate-wiggle',
          explosionColor: '#536DFE'
        };
      case 'western':
        return { 
          overlayColor: 'bg-western-orange/70', 
          panelStyle: 'shadow-amber-900/50 border-3px border-yellow-900/50 bg-comic-dots',
          pageStyle: 'western-text font-comic',
          buttonStyle: 'bg-western-orange hover:bg-western-orange/80',
          explosionColor: '#FF9800'
        };
      case 'minimalist':
        return { 
          overlayColor: 'bg-minimalist-gray/70', 
          panelStyle: 'shadow-md border border-gray-700',
          pageStyle: 'minimalist-text',
          buttonStyle: 'bg-minimalist-gray hover:bg-minimalist-gray/80',
          explosionColor: '#607D8B'
        };
      default:
        return { 
          overlayColor: 'bg-black/50', 
          panelStyle: 'shadow-lg',
          pageStyle: '',
          buttonStyle: 'bg-blue-600 hover:bg-blue-700',
          explosionColor: '#3B82F6'
        };
    }
  };

  // Prepare quiz data from comic key points
  const generateQuizData = () => {
    const allKeyPoints = comicData.pages.flatMap(page => page.keyPoints);
    
    // Create mock quiz questions based on key points
    const quiz = {
      title: `${comicData.topic} Quiz`,
      description: `Test your knowledge about ${comicData.topic}!`,
      questions: allKeyPoints.map((point, index) => {
        // Convert key point into a question
        const question = point.replace(/\bis\b|\bare\b/, "_____ ");
        return {
          id: index + 1,
          question: question,
          options: [
            { id: 'a', text: point.split(' ').slice(-3).join(' '), correct: true },
            { id: 'b', text: "Not this option", correct: false },
            { id: 'c', text: "Nor this one", correct: false },
            { id: 'd', text: "Definitely not this", correct: false }
          ]
        };
      }).slice(0, 5) // Limit to 5 questions
    };
    
    return quiz;
  };
  
  // Start quiz
  const handleStartQuiz = () => {
    setAchievementUnlocked(false);
    setShowQuiz(true);
  };
  
  // Return to comic from quiz
  const handleQuizComplete = (score) => {
    setShowQuiz(false);
    // Add points based on quiz score
    setUserPoints(prev => prev + (score * 10));
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!comicData || !comicData.pages || comicData.pages.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeStyles.background}`}>
        <div className={`text-xl ${themeStyles.text}`}>Loading your comic...</div>
      </div>
    );
  }

  // Show quiz if it's active
  if (showQuiz) {
    return <QuizComponent 
      quizData={generateQuizData()} 
      onComplete={handleQuizComplete} 
      comicTopic={comicData.topic}
    />;
  }

  const currentPage = comicData.pages[currentPageIndex];
  const { overlayColor, panelStyle, pageStyle, buttonStyle, explosionColor } = getThemeClasses();

  return (
    <div className="min-h-screen overflow-hidden" style={{
      backgroundColor: '#FCE4EC',
      backgroundImage: 'radial-gradient(#FF4081 1px, transparent 1px), radial-gradient(#FF4081 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      backgroundPosition: '0 0, 20px 20px'
    }}>
      {/* Comic Book Header */}
      <header className="relative overflow-hidden" style={{ 
        backgroundColor: currentTheme === 'manga' ? '#3D5AFE' : 
                         currentTheme === 'western' ? '#F57C00' : 
                         currentTheme === 'minimalist' ? '#455A64' : '#3D5AFE',
        borderBottom: '3px solid black',
        boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
      }}>
        <div className="comic-dots absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }}></div>
        
        <div className="container mx-auto py-4 px-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 bg-white text-black px-3 py-1 rounded-lg font-comic font-bold border-2 border-black shadow-lg hover:bg-yellow-300 transform hover:-translate-y-1 transition-transform"
                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}
              >
                ← BACK
              </button>
              <div className="comic-logo text-white text-xl md:text-2xl font-extrabold tracking-tight flex items-center">
                <span>{comicData.topic}</span>
                <span className="ml-2 bg-yellow-300 text-black text-xs font-bold px-2 py-1 rounded-full border border-black transform rotate-3">
                  {comicData.complexityLevel}
                </span>
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
              
              <button
                onClick={toggleKeyPoints}
                className="bg-purple-500 border-2 border-black rounded-full px-3 py-1 text-white font-bold shadow-lg flex items-center hover:bg-purple-600 transform hover:scale-105 transition-all"
                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showKeyPoints ? "HIDE NOTES" : "SHOW NOTES"}
              </button>
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

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center">
          {/* Comic Panel */}
          <div 
            className={`relative max-w-5xl w-full bg-white border-4 border-black rounded-lg overflow-hidden ${isTransitioning ? 'opacity-70' : 'opacity-100'} transition-all`} 
            style={{ 
              boxShadow: '8px 8px 0 rgba(0,0,0,0.8)',
              borderRadius: '20px / 10px'
            }}
          >
            {/* Page number badge */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 bg-yellow-400 text-black font-comic font-bold py-1 px-6 border-2 border-black z-10"
              style={{ 
                boxShadow: '3px 3px 0 rgba(0,0,0,0.8)',
                borderRadius: '50% / 60%',
              }}
            >
              PAGE {currentPageIndex + 1} OF {comicData.pages.length}
            </div>
            
            {/* Comic image container */}
            <div className="comic-container relative h-[70vh] flex items-center justify-center p-4">
              {/* Left page turn button */}
              {currentPageIndex > 0 && (
                <div
                  onClick={goToPrevPage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-12 h-28 bg-black/10 hover:bg-black/20 cursor-pointer rounded-l-full flex items-center justify-start pl-2 transition-colors z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              )}
              
              {/* Right page turn button */}
              {currentPageIndex < comicData.pages.length - 1 && (
                <div
                  onClick={goToNextPage}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-28 bg-black/10 hover:bg-black/20 cursor-pointer rounded-r-full flex items-center justify-end pr-2 transition-colors z-10 ${currentPageIndex === 0 ? 'animate-pulse' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              
              {/* Comic image */}
              <div 
                className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              >
                <img 
                  src={currentPage.imageUrl} 
                  alt={`Comic page ${currentPageIndex + 1}`} 
                  className="max-h-full max-w-full object-contain z-0 shadow-lg" 
                />
              </div>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex justify-center items-center mt-8">
            <button
              onClick={goToPrevPage}
              disabled={currentPageIndex === 0 || isTransitioning}
              className={`${
                currentPageIndex === 0 || isTransitioning
                  ? 'opacity-50 cursor-not-allowed'
                  : 'transform hover:-translate-y-1 hover:scale-105'
              } mr-3 bg-gradient-to-r from-blue-500 to-purple-600 py-3 px-6 rounded-lg font-comic text-white font-bold border-3 border-black shadow-lg transition-transform`}
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}
            >
              &lt;&lt; PREVIOUS
            </button>
            
            {currentPageIndex === comicData.pages.length - 1 ? (
              <button
                onClick={handleStartQuiz}
                className="ml-3 bg-gradient-to-r from-yellow-400 to-orange-500 py-3 px-6 rounded-lg font-comic text-white font-bold border-3 border-black shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-transform animate-pulse"
                style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}
              >
                TAKE THE QUIZ! 🎯
              </button>
            ) : (
              <button
                onClick={goToNextPage}
                disabled={currentPageIndex === comicData.pages.length - 1 || isTransitioning}
                className={`${
                  currentPageIndex === comicData.pages.length - 1 || isTransitioning
                    ? 'opacity-50 cursor-not-allowed'
                    : 'transform hover:-translate-y-1 hover:scale-105'
                } ml-3 bg-gradient-to-r from-green-500 to-cyan-500 py-3 px-6 rounded-lg font-comic text-white font-bold border-3 border-black shadow-lg transition-transform ${
                  currentPageIndex === 0 ? 'animate-bounce' : ''
                }`}
                style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.8)' }}
              >
                NEXT &gt;&gt;
              </button>
            )}
          </div>
        </div>
      </main>
      
      {/* Key points sidebar - slide in from right with comic styling */}
      <div
        className={`key-points-sidebar fixed inset-y-0 right-0 z-20 transition-transform duration-300 transform ${
          showKeyPoints ? 'translate-x-0' : 'translate-x-full'
        } w-80 bg-white border-l-4 border-black`}
        style={{ 
          marginTop: '61px',
          boxShadow: '-5px 0 10px rgba(0,0,0,0.3)'
        }}
      >
        <div className="relative h-full overflow-y-auto">
          {/* Sidebar pattern background */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="relative z-10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-comic bg-yellow-300 px-4 py-1 -rotate-2 border-2 border-black" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}>
                KEY NOTES!
              </h2>
              <button
                onClick={toggleKeyPoints}
                className="text-gray-400 hover:text-black transform hover:rotate-90 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 font-comic bg-purple-100 border-2 border-purple-300 rounded-lg p-3 text-purple-800">
              Page {currentPageIndex + 1} of {comicData.pages.length}
              <div className="text-xs mt-1">Capturing these points earns you XP!</div>
            </div>
            
            <ul className="space-y-4">
              {currentPage.keyPoints.map((point, index) => (
                <li key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="bg-white border-2 border-black rounded-lg p-3 font-comic text-black relative" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}>
                    {/* Small explosion in corner */}
                    <div className="absolute -top-2 -left-2 w-8 h-8">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute left-1/2 top-1/2 bg-yellow-400 h-0.5" style={{
                          width: '8px',
                          transformOrigin: 'left center',
                          transform: `rotate(${i * 45}deg)`
                        }}></div>
                      ))}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
                    </div>
                    
                    <div className="pl-4">{point}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Overlay when sidebar is open */}
      {showKeyPoints && (
        <div 
          className="fixed inset-0 bg-black/50 z-10"
          onClick={toggleKeyPoints}
        ></div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 left-4 bg-white border-2 border-black rounded-lg px-3 py-2 font-comic text-sm shadow-lg" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}>
        <div className="flex items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M9 9h6v6H9z" />
            <path d="M9 1v3" />
            <path d="M15 1v3" />
            <path d="M9 20v3" />
            <path d="M15 20v3" />
          </svg>
          <span className="ml-1 font-bold">PRO TIPS:</span>
        </div>
        <p>↑ and ↓ keys to navigate pages</p>
        <p>Press "i" to toggle key points</p>
      </div>
      
      {/* Achievement notification */}
      {achievementUnlocked && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black font-comic px-8 py-4 rounded-lg border-3 border-black shadow-xl z-50 animate-wiggle" style={{ boxShadow: '5px 5px 0 rgba(0,0,0,0.8)' }}>
          <div className="relative">
            {/* Explosion rays */}
            <div className="absolute -inset-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute left-1/2 top-1/2 bg-yellow-300 h-1" style={{
                  width: '30px',
                  transformOrigin: 'left center',
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                }}></div>
              ))}
            </div>
            
            <div className="flex flex-col items-center relative">
              <div className="flex items-center mb-3">
                <svg className="h-8 w-8 mr-3 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="gold" stroke="currentColor" />
                </svg>
                <div>
                  <div className="text-xl font-bold">ACHIEVEMENT UNLOCKED!</div>
                  <div className="text-lg">Comic Completed: +50 XP</div>
                </div>
              </div>
              
              <button 
                onClick={handleStartQuiz}
                className="mt-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-5 py-2 rounded-lg border-2 border-black transform hover:scale-105 transition-transform"
                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}
              >
                Test Your Knowledge! Take The Quiz!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Comic-style footer */}
      <footer className="mt-12 py-4 bg-blue-800 text-white relative overflow-hidden" style={{ borderTop: '3px solid black' }}>
        <div className="comic-dots absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <p className="text-lg font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>WIKICOMICS - LEARN IN STYLE!</p>
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
  );
};

export default ComicViewer; 