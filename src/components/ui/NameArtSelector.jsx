"use client";

import React, { useState } from 'react';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const NameArtSelector = ({ doctorName, onSelection, projectData }) => {
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateNameArt = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-name-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: doctorName,
          count: 12,
          projectId: projectData?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate name art images');
      }
      
      const data = await response.json();
      setGeneratedImages(prev => [...prev, ...data.images]);
    } catch (error) {
      console.error('Name art generation failed:', error);
      setError('Failed to generate name art. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelection = (image) => {
    if (selectedImages.length < 12) {
      setSelectedImages([...selectedImages, image]);
    }
  };

  const removeSelection = (imageToRemove) => {
    setSelectedImages(selectedImages.filter(img => img.id !== imageToRemove.id));
  };

  const proceedToUpload = () => {
    const formattedImages = selectedImages.map((img, index) => {
      const monthKey = MONTH_NAMES[index].toLowerCase();
      return {
        id: `nameArt-${img.id}`,
        month: monthKey,
        name: `${MONTH_NAMES[index]} - Name Art`,
        needsCropping: false,
        [`${monthKey}`]: img.url,
        [`${monthKey}_cropped`]: img.url
      };
    });
    
    onSelection(formattedImages);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        Name Art Generation
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Generated images based on "{doctorName}". Select exactly 12 images for your calendar.
      </p>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateNameArt}
        disabled={isGenerating}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            Generating Name Art...
          </div>
        ) : (
          `Generate ${generatedImages.length === 0 ? 'Initial' : 'More'} Images`
        )}
      </button>

      {/* Generated Images Grid */}
      {generatedImages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Available Images ({generatedImages.length} generated)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedImages.map((image, index) => {
              const isSelected = selectedImages.some(sel => sel.id === image.id);
              return (
                <div
                  key={image.id || index}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${
                    selectedImages.length >= 12 && !isSelected
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      removeSelection(image);
                    } else if (selectedImages.length < 12) {
                      handleSelection(image);
                    }
                  }}
                >
                  <img 
                    src={image.url} 
                    alt={`Name art ${index + 1}`} 
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 text-center">
                    <p className="text-sm text-gray-600">
                      {isSelected ? '✓ Selected' : 'Click to select'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Images Summary */}
      {selectedImages.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Selected Images: {selectedImages.length}/12
          </h4>
          <div className="grid grid-cols-6 gap-2">
            {selectedImages.map((image, index) => (
              <div key={image.id} className="relative">
                <img 
                  src={image.url} 
                  alt={`Selected ${index + 1}`} 
                  className="w-full h-16 object-cover rounded border-2 border-blue-500"
                />
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proceed Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={proceedToUpload}
          disabled={selectedImages.length !== 12}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Proceed to Photo Upload ({selectedImages.length}/12)
        </button>
        
        {selectedImages.length < 12 && (
          <p className="text-gray-500">
            Please select {12 - selectedImages.length} more images
          </p>
        )}
      </div>
    </div>
  );
};

export default NameArtSelector;