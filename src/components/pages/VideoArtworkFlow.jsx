"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';

<<<<<<< HEAD


const ArtworkImage = ({ src, x, y, width, height }) => {

  return ;
};

=======
>>>>>>> 841e2afbc29bcb5181ad5698155e4d728aed718d
const VideoArtworkFlow = ({ 
  formData = { 
    name: "John Doe", 
    image: "https://via.placeholder.com/200x200/4a90e2/ffffff?text=User"
  },
  video1Src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  video2Src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
}) => {
  const [currentStep, setCurrentStep] = useState('start'); // start, video1, host, video2, generate, artwork
  const [showModal, setShowModal] = useState(false);
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const stageRef = useRef(null);

  // Steps: start -> video1 -> host -> video2 -> generate -> artwork

  const handleStart = () => {
    setCurrentStep('video1');
  };

  const handleVideo1End = () => {
    setCurrentStep('host');
  };

  const handleHost = () => {
    setCurrentStep('video2');
  };

  const handleVideo2End = () => {
    setCurrentStep('generate');
    setShowModal(true);
  };

  const handleGenerateArtwork = () => {
    setShowModal(false);
    setCurrentStep('artwork');
  };

  const handleDownload = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `artwork_${formData.name.replace(/\s+/g, '_')}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setCurrentStep('start');
    setShowModal(false);
  };

  // Auto-play videos when step changes
  useEffect(() => {
    if (currentStep === 'video1' && video1Ref.current) {
      video1Ref.current.play().catch(console.error);
    } else if (currentStep === 'video2' && video2Ref.current) {
      video2Ref.current.play().catch(console.error);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Start Button */}
      {currentStep === 'start' && (
        <div className="flex items-center justify-center min-h-screen">
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105"
          >
            Start Experience
          </button>
        </div>
      )}

      {/* First Video */}
      {currentStep === 'video1' && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <video
            ref={video1Ref}
            src={video1Src}
            className="w-full h-full object-cover"
            onEnded={handleVideo1End}
            controls={false}
            muted
            playsInline
          />
        </div>
      )}

      {/* Host Button */}
      {currentStep === 'host' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl mb-6">Ready to host the experience?</h2>
            <button
              onClick={handleHost}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105"
            >
              Host
            </button>
          </div>
        </div>
      )}

      {/* Second Video */}
      {currentStep === 'video2' && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <video
            ref={video2Ref}
            src={video2Src}
            className="w-full h-full object-cover"
            onEnded={handleVideo2End}
            controls={false}
            muted
            playsInline
          />
        </div>
      )}

      {/* Generate Artwork Modal */}
      {showModal && currentStep === 'generate' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white text-black p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4 text-center">Experience Complete!</h3>
            <p className="text-gray-600 mb-6 text-center">
              Create your personalized artwork to commemorate this experience.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleGenerateArtwork}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all"
              >
                Generate Artwork
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artwork Generation */}
      {currentStep === 'artwork' && (
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Your Personalized Artwork</h2>
            
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <Stage width={600} height={400} ref={stageRef}>
                  <Layer>
                    {/* Background */}
                    <Rect
                      x={0}
                      y={0}
                      width={600}
                      height={400}
                      fill="linear-gradient(45deg, #667eea 0%, #764ba2 100%)"
                    />
                    
                    {/* Decorative background */}
                    <Rect
                      x={0}
                      y={0}
                      width={600}
                      height={400}
                      fill="rgba(255,255,255,0.1)"
                    />
                    
                    {/* Title */}
                    <Text
                      x={300}
                      y={30}
                      text="Experience Certificate"
                      fontSize={28}
                      fontFamily="Arial"
                      fill="white"
                      align="center"
                      width={600}
                      fontStyle="bold"
                    />
                    
                    {/* User Image */}
                    <ArtworkImage
                      src={formData.image}
                      x={225}
                      y={80}
                      width={150}
                      height={150}
                    />
                    
                    {/* User Name */}
                    <Text
                      x={300}
                      y={250}
                      text={formData.name}
                      fontSize={24}
                      fontFamily="Arial"
                      fill="white"
                      align="center"
                      width={600}
                      fontStyle="bold"
                    />
                    
                    {/* Completion Text */}
                    <Text
                      x={300}
                      y={290}
                      text="Successfully completed the immersive experience"
                      fontSize={16}
                      fontFamily="Arial"
                      fill="rgba(255,255,255,0.9)"
                      align="center"
                      width={600}
                    />
                    
                    {/* Date */}
                    <Text
                      x={300}
                      y={320}
                      text={new Date().toLocaleDateString()}
                      fontSize={14}
                      fontFamily="Arial"
                      fill="rgba(255,255,255,0.8)"
                      align="center"
                      width={600}
                    />
                    
                    {/* Decorative border */}
                    <Rect
                      x={20}
                      y={20}
                      width={560}
                      height={360}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </Layer>
                </Stage>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Artwork</span>
              </button>
              
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoArtworkFlow;