import React, { useState, useEffect } from 'react';

const QuizComponent = ({ quizData, onComplete, comicTopic }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const totalQuestions = quizData.questions.length;
  const currentQuestion = quizData.questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (showResults || showFeedback) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, showFeedback, showResults]);

  // Handle option selection
  const handleOptionSelect = (questionId, optionId) => {
    if (showFeedback) return;
    
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId
    });
  };

  // Check answer and show feedback
  const checkAnswer = () => {
    const selectedOption = selectedOptions[currentQuestion.id];
    if (!selectedOption) return;
    
    const selectedOptionObj = currentQuestion.options.find(option => option.id === selectedOption);
    const isAnswerCorrect = selectedOptionObj.correct;
    
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
    }
    
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);
    
    // Automatically move to next question after feedback
    setTimeout(() => {
      setShowFeedback(false);
      handleNextQuestion();
    }, 2000);
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(30);
    } else {
      setShowResults(true);
    }
  };

  // Finish quiz and return to comic
  const handleFinish = () => {
    onComplete(score);
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{
      backgroundColor: '#E8F5E9',
      backgroundImage: 'radial-gradient(#4CAF50 1px, transparent 1px), radial-gradient(#4CAF50 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      backgroundPosition: '0 0, 20px 20px'
    }}>
      {/* Quiz Header */}
      <header className="relative overflow-hidden" style={{ 
        backgroundColor: '#673AB7',
        borderBottom: '3px solid black',
        boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
      }}>
        <div className="comic-dots absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }}></div>
        
        <div className="container mx-auto py-4 px-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="comic-logo text-white text-xl md:text-2xl font-extrabold tracking-tight flex items-center">
              <span>{comicTopic} QUIZ</span>
              <span className="ml-2 bg-yellow-300 text-black text-xs font-bold px-2 py-1 rounded-full border border-black transform rotate-3">
                TEST YOUR KNOWLEDGE!
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-300 border-2 border-black rounded-full px-3 py-1 text-black font-bold shadow-lg" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                <div className="flex items-center">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" fill="#FFC107" />
                    <path d="M12 6v6l4 2" stroke="black" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{timeLeft}s</span>
                </div>
              </div>
              
              <div className="bg-pink-500 border-2 border-black rounded-full px-3 py-1 text-white font-bold shadow-lg" style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
                <div className="flex items-center">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 4L12 14.01l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Score: {score}/{totalQuestions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comic style explosion lines */}
        <div className="absolute left-0 top-0 w-40 h-40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute left-0 top-0 bg-yellow-300 h-1" style={{
              width: '100px',
              transformOrigin: '0 0',
              transform: `rotate(${i * 30}deg)`,
              opacity: 0.7
            }}></div>
          ))}
        </div>
      </header>

      {/* Quiz Content */}
      <div className="container mx-auto py-8 px-4">
        {!showResults ? (
          <div className="max-w-3xl mx-auto">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="w-full h-4 bg-gray-200 rounded-full border-2 border-black overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                  style={{ width: `${(currentQuestionIndex / totalQuestions) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-1 font-comic">
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span>{Math.round((currentQuestionIndex / totalQuestions) * 100)}% Complete</span>
              </div>
            </div>
            
            {/* Question Panel */}
            <div 
              className="relative bg-white border-4 border-black rounded-lg p-6 mb-6" 
              style={{ 
                boxShadow: '8px 8px 0 rgba(0,0,0,0.8)',
                borderRadius: '20px / 10px'
              }}
            >
              {/* Question number badge */}
              <div 
                className="absolute top-0 left-4 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-comic font-bold py-1 px-6 border-2 border-black z-10"
                style={{ 
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.8)',
                  borderRadius: '50% / 60%',
                }}
              >
                QUESTION {currentQuestionIndex + 1}
              </div>
              
              <h3 className="text-xl font-bold font-comic text-gray-800 mt-4 mb-6">{currentQuestion.question}</h3>
              
              {/* Timer */}
              <div className="absolute top-4 right-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-black ${
                  timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-green-100'
                }`}>
                  {timeLeft}
                </div>
              </div>
              
              {/* Show character reading question */}
              
            </div>
            
            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentQuestion.options.map((option) => (
                <div 
                  key={option.id}
                  onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                  className={`
                    relative bg-white border-3 border-black p-4 rounded-lg font-comic cursor-pointer transform transition-transform hover:scale-105
                    ${selectedOptions[currentQuestion.id] === option.id ? 'bg-purple-100 border-purple-500 -translate-y-1' : ''}
                    ${showFeedback && option.correct ? 'bg-green-100 border-green-500' : ''}
                    ${showFeedback && selectedOptions[currentQuestion.id] === option.id && !option.correct ? 'bg-red-100 border-red-500' : ''}
                  `}
                  style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.7)' }}
                >
                  <div className="flex items-center">
                    <div 
                      className={`
                        w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold mr-3
                        ${selectedOptions[currentQuestion.id] === option.id ? 'bg-purple-500 text-white' : 'bg-gray-200'}
                        ${showFeedback && option.correct ? 'bg-green-500 text-white' : ''}
                        ${showFeedback && selectedOptions[currentQuestion.id] === option.id && !option.correct ? 'bg-red-500 text-white' : ''}
                      `}
                    >
                      {option.id.toUpperCase()}
                    </div>
                    <span className="text-lg">{option.text}</span>
                  </div>
                  
                  {/* Show correct/incorrect icons during feedback */}
                  {showFeedback && option.correct && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {showFeedback && selectedOptions[currentQuestion.id] === option.id && !option.correct && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Submit Answer Button */}
            <div className="flex justify-center">
              <button
                onClick={checkAnswer}
                disabled={!selectedOptions[currentQuestion.id] || showFeedback}
                className={`
                  py-3 px-8 font-comic text-xl font-bold border-3 border-black rounded-lg shadow-lg transform transition-transform
                  ${!selectedOptions[currentQuestion.id] || showFeedback ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:-translate-y-1 hover:scale-105'}
                `}
                style={{ boxShadow: '5px 5px 0 rgba(0,0,0,0.8)' }}
              >
                SUBMIT ANSWER!
              </button>
            </div>
            
            {/* Feedback popup */}
            {showFeedback && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div 
                  className={`relative bg-white border-4 ${isCorrect ? 'border-green-500' : 'border-red-500'} rounded-lg p-8 max-w-md text-center transform scale-110 animate-bounce-small`}
                  style={{ boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}
                >
                  {/* Explosion lines */}
                  <div className="absolute -inset-4">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="absolute left-1/2 top-1/2 bg-yellow-300 h-1" style={{
                        width: '30px',
                        transformOrigin: 'left center',
                        transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                      }}></div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <h3 className="text-2xl font-comic font-bold mb-2">{isCorrect ? 'CORRECT!' : 'WRONG!'}</h3>
                    <div className="text-5xl mb-2">{isCorrect ? '🎉' : '😢'}</div>
                    <p className="font-comic">{isCorrect ? '+1 to your score!' : 'Better luck on the next one!'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Results Section */
          <div className="max-w-3xl mx-auto">
            <div 
              className="bg-white border-4 border-black rounded-lg p-8 text-center"
              style={{ 
                boxShadow: '8px 8px 0 rgba(0,0,0,0.8)',
                borderRadius: '20px / 10px'
              }}
            >
              {/* Results header with explosion effect */}
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-6">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="absolute left-1/2 top-1/2 bg-yellow-300 h-1" style={{
                      width: '40px',
                      transformOrigin: 'left center',
                      transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`
                    }}></div>
                  ))}
                </div>
                
                <h2 className="relative text-3xl font-comic font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
                  QUIZ COMPLETED!
                </h2>
              </div>
              
              <div className="mb-8">
                <div className="text-6xl font-bold mb-2">{score} / {totalQuestions}</div>
                <div className="text-xl font-comic mb-4">
                  {score === totalQuestions ? 'Perfect Score! You\'re Amazing!' : 
                   score >= totalQuestions * 0.7 ? 'Great Job! Almost Perfect!' :
                   score >= totalQuestions * 0.5 ? 'Good Effort! Keep Learning!' :
                   'Keep Reading The Comic To Learn More!'}
                </div>
                <div className="text-5xl mb-4">
                  {score === totalQuestions ? '🏆' : 
                   score >= totalQuestions * 0.7 ? '🥇' :
                   score >= totalQuestions * 0.5 ? '🥈' : '🥉'}
                </div>
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 inline-block">
                  <div className="text-yellow-800 font-comic">
                    <span className="font-bold">XP EARNED:</span> {score * 10} points!
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleFinish}
                className="py-3 px-8 font-comic text-xl font-bold border-3 border-black rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-cyan-500 text-white transform hover:-translate-y-1 hover:scale-105 transition-transform"
                style={{ boxShadow: '5px 5px 0 rgba(0,0,0,0.8)' }}
              >
                BACK TO COMIC!
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Comic-style footer */}
      <footer className="mt-12 py-4 bg-purple-800 text-white relative overflow-hidden" style={{ borderTop: '3px solid black' }}>
        <div className="comic-dots absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <p className="text-lg font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>QUIZ TIME - TEST YOUR KNOWLEDGE!</p>
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
      </footer>
    </div>
  );
};

export default QuizComponent; 