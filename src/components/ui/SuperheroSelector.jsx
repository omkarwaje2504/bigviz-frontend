"use client";

import React, { useState, useRef } from 'react';
import { FaCamera, FaUpload, FaTimes } from 'react-icons/fa';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SUPERHERO_OPTIONS = [
  { id: 'avenger', name: 'Make me as Avenger', prompt: 'Transform into Marvel Avenger superhero with costume and powers', icon: '🦸‍♂️' },
  { id: 'ronaldo', name: 'Ronaldo', prompt: 'Transform into Cristiano Ronaldo football style with jersey and ball', icon: '⚽' },
  { id: 'pilot', name: 'Show me like a Pilot', prompt: 'Transform into professional airline pilot with uniform and aviators', icon: '✈️' },
  { id: 'batman', name: 'Batman Style', prompt: 'Transform into Batman dark knight with cape and mask', icon: '🦇' },
  { id: 'superman', name: 'Superman Style', prompt: 'Transform into Superman with red cape and S symbol', icon: '🔴' },
  { id: 'iron_man', name: 'Iron Man', prompt: 'Transform into Iron Man with metallic red and gold armor suit', icon: '🤖' },
  { id: 'captain_america', name: 'Captain America', prompt: 'Transform into Captain America with shield and star spangled uniform', icon: '🛡️' },
  { id: 'wonder_woman', name: 'Wonder Woman', prompt: 'Transform into Wonder Woman warrior with golden lasso and tiara', icon: '👑' },
  { id: 'thor', name: 'Thor', prompt: 'Transform into Thor god of thunder with hammer and lightning', icon: '⚡' },
  { id: 'spider_man', name: 'Spider-Man', prompt: 'Transform into Spider-Man with web shooters and mask', icon: '🕷️' },
  { id: 'hulk', name: 'Hulk', prompt: 'Transform into Hulk green giant with incredible strength', icon: '💚' },
  { id: 'black_widow', name: 'Black Widow', prompt: 'Transform into Black Widow spy with tactical gear', icon: '🕸️' }
];

const SuperheroSelector = ({ onSelection, projectData }) => {
  const [doctorPhoto, setDoctorPhoto] = useState(null);
  const [doctorPhotoFile, setDoctorPhotoFile] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handlePhotoUpload = (event, source = 'gallery') => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Photo size must be less than 10MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        setDoctorPhoto(e.target.result);
        setDoctorPhotoFile(file);
      };
      reader.readAsDataURL(file);
    }
    
    // Clear input value to allow re-uploading same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const removePhoto = () => {
    setDoctorPhoto(null);
    setDoctorPhotoFile(null);
    setGeneratedImages([]);
  };

  const handleOptionSelection = (option) => {
    if (selectedOptions.find(o => o.id === option.id)) {
      // Remove if already selected
      setSelectedOptions(selectedOptions.filter(o => o.id !== option.id));
    } else if (selectedOptions.length < 12) {
      // Add if under limit
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const removeOption = (optionId) => {
    setSelectedOptions(selectedOptions.filter(o => o.id !== optionId));
  };

  const generateSuperheroImages = async () => {
    if (!doctorPhoto || selectedOptions.length === 0) {
      setError('Please upload a doctor photo and select at least one superhero style');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('doctorPhoto', doctorPhotoFile);
      formData.append('options', JSON.stringify(selectedOptions));
      formData.append('projectId', projectData?.id || '');
      
      const response = await fetch('/api/generate-superhero', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate superhero images: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const resultsWithOptions = data.images.map((result, index) => ({
        ...result,
        option: selectedOptions[index] || selectedOptions[0],
        id: `superhero-${selectedOptions[index]?.id || index}-${Date.now()}`
      }));
      
      setGeneratedImages(resultsWithOptions);
      
    } catch (error) {
      console.error('Superhero generation failed:', error);
      setError(`Failed to generate superhero images: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const proceedToUpload = () => {
    if (generatedImages.length === 0) {
      setError('No generated images to proceed with');
      return;
    }
    
    const finalImages = generatedImages.slice(0, 12).map((img, index) => {
      const monthKey = MONTH_NAMES[index]?.toLowerCase() || `month_${index + 1}`;
      return {
        id: `superhero-${img.id || index}`,
        month: monthKey,
        name: `${MONTH_NAMES[index] || `Month ${index + 1}`} - ${img.option?.name || 'Superhero'}`,
        needsCropping: false,
        [`${monthKey}`]: img.url,
        [`${monthKey}_cropped`]: img.url
      };
    });
    
    onSelection(finalImages);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        Superhero Transformation
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Upload doctor's photo and select superhero styles to create amazing transformations.
      </p>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      {/* Doctor Photo Upload Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Step 1: Upload Doctor Photo
        </h3>
        
        {!doctorPhoto ? (
          <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center">
            <div className="mb-4">
              <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload a clear photo of the doctor
            </p>
            <div className="flex gap-4 justify-center">
              <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-flex items-center gap-2">
                <FaUpload className="h-4 w-4" />
                Choose from Gallery
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'gallery')}
                  className="hidden"
                />
              </label>
              <label className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-flex items-center gap-2">
                <FaCamera className="h-4 w-4" />
                Take Photo
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoUpload(e, 'camera')}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">Max size: 10MB • Formats: JPG, PNG, WebP</p>
          </div>
        ) : (
          <div className="relative inline-block">
            <img 
              src={doctorPhoto} 
              alt="Doctor" 
              className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500"
            />
            <button
              onClick={removePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              title="Remove photo"
            >
              <FaTimes className="h-4 w-4" />
            </button>
            <p className="text-sm text-gray-600 mt-2">Doctor photo uploaded ✓</p>
          </div>
        )}
      </div>

      {/* Superhero Options Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Step 2: Select Superhero Styles (Max 12)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPERHERO_OPTIONS.map(option => {
            const isSelected = selectedOptions.find(o => o.id === option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelection(option)}
                disabled={selectedOptions.length >= 12 && !isSelected}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                } ${
                  selectedOptions.length >= 12 && !isSelected
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-white">
                      {option.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {option.prompt}
                    </p>
                    {isSelected && (
                      <span className="inline-block mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Options Summary */}
      {selectedOptions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Selected Styles: {selectedOptions.length}/12
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map(option => (
              <span 
                key={option.id} 
                className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
              >
                {option.icon} {option.name}
                <button
                  onClick={() => removeOption(option.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-8">
        <button
          onClick={generateSuperheroImages}
          disabled={!doctorPhoto || selectedOptions.length === 0 || isGenerating}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Generating Superhero Images...
            </>
          ) : (
            <>
              🚀 Generate Superhero Images ({selectedOptions.length} styles)
            </>
          )}
        </button>
      </div>

      {/* Generated Images Preview */}
      {generatedImages.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Generated Images ({generatedImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {generatedImages.map((img, index) => (
              <div key={img.id} className="text-center">
                <img 
                  src={img.url} 
                  alt={img.option?.name || `Superhero ${index + 1}`} 
                  className="w-full h-24 object-cover rounded border-2 border-purple-500"
                  onError={(e) => {
                    e.target.src = '/placeholder-superhero.jpg';
                  }}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {img.option?.name || `Style ${index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proceed Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={proceedToUpload}
          disabled={generatedImages.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Proceed to Photo Upload ({Math.min(generatedImages.length, 12)}/12 images)
        </button>
        
        {generatedImages.length === 0 && (
          <p className="text-gray-500">
            Generate superhero images first to proceed
          </p>
        )}
      </div>
    </div>
  );
};

export default SuperheroSelector;