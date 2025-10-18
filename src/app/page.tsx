"use client";
import React, { useState, useRef, useEffect } from "react";
import etro from "etro";

export default function EtroVideoConverter() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Watermark settings
  const [watermarkText, setWatermarkText] = useState("Omkar Waje");
  const [watermarkPosition, setWatermarkPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center">("bottom-right");
  const [watermarkSize, setWatermarkSize] = useState(40);
  const [watermarkColor, setWatermarkColor] = useState("#ffffff");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
      setOutputUrl(null);
      setLogs([]);
    }
  };

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const convertVideo = async () => {
    if (!videoFile || !canvasRef.current || !videoRef.current) return;

    setProcessing(true);
    setProgress(0);
    setLogs([]);

    const video = videoRef.current;
    
    // Wait for video to load
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
      video.load();
    });

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    addLog(`Video: ${video.videoWidth}x${video.videoHeight}`);
    addLog(`Duration: ${video.duration.toFixed(2)}s`);
    if (watermarkText) {
      addLog(`Watermark: "${watermarkText}" at ${watermarkPosition}`);
    }

    try {
      // Create Etro movie
      const movie = new etro.Movie({ canvas });

      // Add video layer
      const videoLayer = new etro.layer.Video({
        source: video,
        startTime: 0,
        duration: video.duration,
      });
      movie.addLayer(videoLayer);

      // Calculate text position
      let textX = 20;
      let textY = 20;
      const padding = 20;

      switch (watermarkPosition) {
        case "top-left":
          textX = padding;
          textY = padding + watermarkSize;
          break;
        case "top-right":
          textX = canvas.width - padding;
          textY = padding + watermarkSize;
          break;
        case "bottom-left":
          textX = padding;
          textY = canvas.height - padding;
          break;
        case "bottom-right":
          textX = canvas.width - padding;
          textY = canvas.height - padding;
          break;
        case "center":
          textX = canvas.width / 2;
          textY = canvas.height / 2;
          break;
      }

      // Add text watermark layer if text is provided
      if (watermarkText) {
        const textLayer = new etro.layer.Text({
          startTime: 0,
          duration: video.duration,
          text: watermarkText,
          font: `bold ${watermarkSize}px Arial`,
          color: etro.parseColor(watermarkColor),
          textX: textX,
          textY: textY,
          textAlign: watermarkPosition.includes("right") ? "right" : watermarkPosition === "center" ? "center" : "left",
          textBaseline: "alphabetic",
          textStroke: {
            color: etro.parseColor("#000000"),
            thickness: 2,
          },
        });
        movie.addLayer(textLayer);
      }

      addLog("Starting conversion...");

      // Record the movie
      const blob = await movie.record({
        frameRate: 30,
        video: {
          width: canvas.width,
          height: canvas.height,
        },
        audio: true, // Include audio from the video
      });

      addLog("Conversion complete!");
      
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setProcessing(false);
      setProgress(100);

    } catch (error) {
      addLog(`Error: ${error}`);
      console.error(error);
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Etro.js Video Converter</h1>
      <p className="text-sm text-gray-600">
        Powerful video editing framework with text watermark
      </p>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Video:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {videoSrc && (
          <>
            {/* Watermark Settings */}
            <div className="border border-gray-300 rounded p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">Watermark Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Watermark Text:</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter your name"
                    className="block w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position:</label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value as any)}
                    className="block w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Text Size: {watermarkSize}px</label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={watermarkSize}
                    onChange={(e) => setWatermarkSize(Number(e.target.value))}
                    className="block w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Text Color:</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="h-10 w-20 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Original Video:</h3>
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                crossOrigin="anonymous"
                className="rounded shadow max-w-full"
                style={{ maxHeight: "400px" }}
              />
            </div>

            <button
              onClick={convertVideo}
              disabled={processing}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {processing ? "Converting..." : "Convert with Watermark"}
            </button>
          </>
        )}

        {processing && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Processing video...</p>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Logs:</h3>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-48 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {outputUrl && (
          <div>
            <h3 className="font-semibold mb-2">Converted Video with Watermark:</h3>
            <video 
              src={outputUrl} 
              controls 
              className="rounded shadow max-w-full"
              style={{ maxHeight: "400px" }}
            />
            <a
              href={outputUrl}
              download="watermarked_video.mp4"
              className="inline-block mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Download Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
