"use client";

import React, { useState, useEffect } from 'react';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Initial patterns data structure
const INITIAL_PATTERNS = {
  design: {
    name_patterns: {
      A: "vol_1", B: "vol_2", C: "vol_3", D: "vol_4", E: "vol_5", F: "vol_6",
      G: "vol_7", H: "vol_8", I: "vol_9", J: "vol_10", K: "vol_11", L: "vol_12",
      M: "vol_13", N: "vol_14", O: "vol_15", P: "vol_16", Q: "vol_17", R: "vol_18",
      S: "vol_19", T: "vol_20", U: "vol_21", V: "vol_22", W: "vol_23", X: "vol_24",
      Y: "vol_25", Z: "vol_26"
    }
  },
  // This would normally be loaded from your API or JSON file
  pattern_data: {
    vol_1: Array.from({ length: 24 }, (_, i) => ({
      id: `A_${i + 1}`,
      url: `/patterns/A/design_${i + 1}.jpg`,
      name: `A Pattern ${i + 1}`,
      letter: 'A'
    })),
    vol_2: Array.from({ length: 24 }, (_, i) => ({
      id: `B_${i + 1}`,
      url: `/patterns/B/design_${i + 1}.jpg`,
      name: `B Pattern ${i + 1}`,
      letter: 'B'
    })),
    // Continue for all letters... (you'll need to populate this with actual data)
  }
};

const InitialSelector = ({ doctorName, onSelection, projectData }) => {
  const [selectedLetter, setSelectedLetter] = useState('');
  const [availablePatterns, setAvailablePatterns] = useState([]);
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-select the first letter of doctor's name
  useEffect(() => {
    if (doctorName && !selectedLetter) {
      const firstLetter = doctorName.charAt(0).toUpperCase();
      if (firstLetter.match(/[A-Z]/)) {
        handleLetterSelection(firstLetter);
      }
    }
  }, [doctorName]);

  const handleLetterSelection = async (letter) => {
    setSelectedLetter(letter);
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, you'd fetch from your API
      const volume = INITIAL_PATTERNS.design.name_patterns[letter];
      
      // Simulate API call to get patterns for the letter
      const response = await fetch(`/api/get-initial-patterns/${letter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePatterns(data.patterns || []);
      } else {
        // Fallback to static data if API fails
        const patterns = INITIAL_PATTERNS.pattern_data[volume] || [];
        setAvailablePatterns(patterns);
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
      setError('Failed to load patterns. Please try again.');
      // Fallback to static data
      const volume = INITIAL_PATTERNS.design.name_patterns[letter];
      const patterns = INITIAL_PATTERNS.pattern_data[volume] || [];
      setAvailablePatterns(patterns);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatternSelection = (pattern) => {
    if (selectedPatterns.length < 12 && !selectedPatterns.some(p => p.id === pattern.id)) {
      setSelectedPatterns([...selectedPatterns, pattern]);
    }
  };

  const removePattern = (patternToRemove) => {
    setSelectedPatterns(selectedPatterns.filter(p => p.id !== patternToRemove.id));
  };

  const proceedToUpload = () => {
    const formattedImages = selectedPatterns.map((pattern, index) => {
      const monthKey = MONTH_NAMES[index].toLowerCase();
      return {
        id: `initial-${pattern.id}`,
        month: monthKey,
        name: `${MONTH_NAMES[index]} - ${pattern.name}`,
        needsCropping: false,
        [`${monthKey}`]: pattern.url,
        [`${monthKey}_cropped`]: pattern.url
      };
    });
    
    onSelection(formattedImages);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        Name Initial Patterns
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Select patterns for "{doctorName}" (Starting with: {doctorName.charAt(0).toUpperCase()})
      </p>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      {/* Alphabet Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Select Letter:
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
          {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
            <button
              key={letter}
              onClick={() => handleLetterSelection(letter)}
              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading patterns for "{selectedLetter}"...</p>
        </div>
      )}

      {/* Pattern Selection Grid */}
      {!isLoading && availablePatterns.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Available Patterns for "{selectedLetter}" ({availablePatterns.length} designs)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availablePatterns.map(pattern => {
              const isSelected = selectedPatterns.some(p => p.id === pattern.id);
              return (
                <div
                  key={pattern.id}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${
                    selectedPatterns.length >= 12 && !isSelected
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      removePattern(pattern);
                    } else if (selectedPatterns.length < 12) {
                      handlePatternSelection(pattern);
                    }
                  }}
                >
                  <img 
                    src={pattern.url} 
                    alt={pattern.name} 
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-pattern.jpg'; // Fallback image
                    }}
                  />
                  <div className="p-2">
                    <p className="text-xs text-center text-gray-600 truncate">
                      {pattern.name}
                    </p>
                    <p className="text-xs text-center text-gray-500">
                      {isSelected ? '✓ Selected' : 'Click to select'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Patterns Summary */}
      {selectedPatterns.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Selected Patterns: {selectedPatterns.length}/12
          </h4>
          <div className="grid grid-cols-6 gap-2">
            {selectedPatterns.map((pattern, index) => (
              <div key={pattern.id} className="relative">
                <img 
                  src={pattern.url} 
                  alt={`Selected ${index + 1}`} 
                  className="w-full h-16 object-cover rounded border-2 border-blue-500"
                  onError={(e) => {
                    e.target.src = '/placeholder-pattern.jpg';
                  }}
                />
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePattern(pattern);
                  }}
                  className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proceed Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={proceedToUpload}
          disabled={selectedPatterns.length !== 12}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Proceed to Photo Upload ({selectedPatterns.length}/12)
        </button>
        
        {selectedPatterns.length < 12 && (
          <p className="text-gray-500">
            Please select {12 - selectedPatterns.length} more patterns
          </p>
        )}
      </div>
    </div>
  );
};

export default InitialSelector;