"use client";
import React, { useEffect, useRef, useState } from "react";

const IBDVideoGenerator = ({
  name = "Doctor Name",
  photo = "",
  gender = "Male",
  speciality = "Doctor",
  clinic_name = "Clinic Name",
  clinic_address = "Clinic Address",
  doctorAudio = { downloadUrl: "", duration: 5, text: "" },
  language = "english",
}) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [timelineElements, setTimelineElements] = useState([]);
  const [exportProgress, setExportProgress] = useState(0);

  const updateProgress = (percent, text) => {
    setProgress(percent);
    setProgressText(text);
  };

  // Browser-based video export using MediaRecorder API
  const exportVideo = async () => {
    if (!timelineElements.length) {
      setError("Please generate timeline first");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions for video
      canvas.width = 1920;
      canvas.height = 1080;

      // Load doctor image
      const doctorImg = new Image();
      doctorImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        doctorImg.onload = resolve;
        doctorImg.onerror = reject;
        doctorImg.src = photo;
      });

      // Create audio element if audio URL is provided
      let audioElement = null;
      let audioStream = null;

      if (doctorAudio.downloadUrl) {
        audioElement = new Audio();
        audioElement.crossOrigin = "anonymous";
        audioElement.src = doctorAudio.downloadUrl;

        await new Promise((resolve, reject) => {
          audioElement.oncanplaythrough = resolve;
          audioElement.onerror = reject;
          audioElement.load();
        });

        // Create audio stream using WebRTC
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination); // For monitoring
        audioStream = destination.stream;
      }

      // Capture canvas stream
      const canvasStream = canvas.captureStream(30); // 30 FPS

      // Combine video and audio streams
      const combinedStream = new MediaStream();

      // Add video track from canvas
      const videoTrack = canvasStream.getVideoTracks()[0];
      combinedStream.addTrack(videoTrack);

      // Add audio track if available
      if (audioStream) {
        const audioTrack = audioStream.getAudioTracks()[0];
        combinedStream.addTrack(audioTrack);
      }

      // Setup MediaRecorder
      const recordedChunks = [];
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus", // Fallback to vp8 if needed
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Animation and recording logic
      const totalDuration = 15 + doctorAudio.duration + 4.17; // Total video duration in seconds
      const fps = 30;
      const totalFrames = Math.ceil(totalDuration * fps);
      let currentFrame = 0;

      // Start recording
      mediaRecorder.start(100); // Capture every 100ms

      // Start audio playback if available
      if (audioElement) {
        setTimeout(() => {
          audioElement.play();
        }, 5000); // Start audio at 15 seconds
      }

      // Animation loop
      const animate = () => {
        const currentTime = currentFrame / fps;

        // Update export progress
        const progressPercent = Math.min(
          100,
          (currentFrame / totalFrames) * 100,
        );
        setExportProgress(progressPercent);

        // Clear canvas
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render timeline elements based on current time
        timelineElements.forEach((element) => {
          if (
            currentTime >= element.startTime &&
            currentTime <= element.startTime + element.duration
          ) {
            renderElement(ctx, element, currentTime, doctorImg);
          }
        });

        currentFrame++;

        if (currentFrame < totalFrames) {
          // Continue animation
          setTimeout(animate, 1000 / fps);
        } else {
          // Stop recording
          mediaRecorder.stop();
          if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
          }
        }
      };

      // Handle recording completion
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement("a");
        a.href = url;
        a.download = `IBD-${name.replace(/\s+/g, "-")}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Cleanup
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress(0);
        alert("Video exported successfully! Check your downloads folder.");
      };

      // Start animation
      animate();
    } catch (error) {
      console.error("Export error:", error);
      setError(`Export failed: ${error.message}`);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Render individual timeline elements on canvas
  const renderElement = (ctx, element, currentTime, doctorImg) => {
    let x = element.x;
    let y = element.y;
    let opacity = 1;

    // Handle animations
    if (element.animations) {
      const animationProgress = Math.min(
        1,
        (currentTime - element.startTime) / 0.83,
      );

      element.animations.forEach((anim) => {
        if (anim.type === "slideIn") {
          x = anim.from.x + (anim.to.x - anim.from.x) * animationProgress;
        }
        if (anim.type === "fadeIn") {
          opacity =
            anim.from.opacity +
            (anim.to.opacity - anim.from.opacity) * animationProgress;
        }
      });
    }

    ctx.save();
    ctx.globalAlpha = opacity;

    switch (element.type) {
      case "Rectangle":
        ctx.fillStyle = element.fill;
        ctx.fillRect(x, y, element.width, element.height);
        break;

      case "Text":
        ctx.fillStyle = element.fill;
        ctx.font = `${element.fontWeight || "normal"} ${element.fontSize}px ${element.fontFamily}`;
        ctx.textAlign = element.textAlign || "left";

        if (element.textAlign === "center") {
          ctx.fillText(
            element.text,
            x + element.width / 2,
            y + element.height / 2,
          );
        } else {
          ctx.fillText(element.text, x, y + element.fontSize);
        }
        break;

      case "Image":
        if (doctorImg.complete) {
          ctx.drawImage(doctorImg, x, y, element.width, element.height);
        }
        break;
    }

    ctx.restore();
  };

  // WebCodecs API alternative for faster export (newer browsers)
  const exportVideoWebCodecs = async () => {
    if (!("VideoEncoder" in window)) {
      setError(
        "WebCodecs not supported in this browser. Use standard export instead.",
      );
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // This is a more advanced implementation using WebCodecs
      // Requires additional setup but renders much faster
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = 1920;
      canvas.height = 1080;

      // Load doctor image
      const doctorImg = new Image();
      doctorImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        doctorImg.onload = resolve;
        doctorImg.onerror = reject;
        doctorImg.src = photo;
      });

      const chunks = [];
      const totalDuration = 15 + doctorAudio.duration + 4.17;
      const fps = 30;
      const totalFrames = Math.ceil(totalDuration * fps);

      // Configure video encoder
      const encoder = new VideoEncoder({
        output: (chunk) => {
          chunks.push(chunk);
        },
        error: (error) => {
          console.error("Encoder error:", error);
          setError("Encoding failed");
          setIsExporting(false);
        },
      });

      encoder.configure({
        codec: "vp09.00.10.08",
        width: 1920,
        height: 1080,
        bitrate: 2000000,
        framerate: fps,
      });

      // Render and encode frames
      for (let frame = 0; frame < totalFrames; frame++) {
        const currentTime = frame / fps;
        setExportProgress((frame / totalFrames) * 100);

        // Clear and render frame
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        timelineElements.forEach((element) => {
          if (
            currentTime >= element.startTime &&
            currentTime <= element.startTime + element.duration
          ) {
            renderElement(ctx, element, currentTime, doctorImg);
          }
        });

        // Create VideoFrame from canvas
        const videoFrame = new VideoFrame(canvas, {
          timestamp: (frame * 1000000) / fps, // microseconds
        });

        encoder.encode(videoFrame);
        videoFrame.close();

        // Allow UI updates
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Finish encoding
      await encoder.flush();
      encoder.close();

      // Create blob and download
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IBD-${name.replace(/\s+/g, "-")}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportProgress(0);
      alert("Video exported successfully using WebCodecs!");
    } catch (error) {
      console.error("WebCodecs export error:", error);
      setError(`WebCodecs export failed: ${error.message}`);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Timeline element renderer component (same as before)
  const TimelineElement = ({ element, currentTime }) => {
    const isVisible =
      currentTime >= element.startTime &&
      currentTime <= element.startTime + element.duration;

    if (!isVisible) return null;

    const style = {
      position: "absolute",
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      zIndex: element.zIndex || 1,
      transition: "all 0.3s ease",
    };

    // Handle animations
    if (element.animations) {
      const animationProgress = Math.min(
        1,
        (currentTime - element.startTime) / 0.83,
      );
      element.animations.forEach((anim) => {
        if (anim.type === "slideIn") {
          const currentX =
            anim.from.x + (anim.to.x - anim.from.x) * animationProgress;
          style.left = currentX;
        }
        if (anim.type === "fadeIn") {
          const currentOpacity =
            anim.from.opacity +
            (anim.to.opacity - anim.from.opacity) * animationProgress;
          style.opacity = currentOpacity;
        }
      });
    }

    switch (element.type) {
      case "Rectangle":
        return (
          <div
            key={element.id}
            style={{
              ...style,
              backgroundColor: element.fill,
            }}
          />
        );

      case "Text":
        return (
          <div
            key={element.id}
            style={{
              ...style,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              color: element.fill,
              textAlign: element.textAlign || "left",
              display: "flex",
              alignItems: "center",
              justifyContent:
                element.textAlign === "center" ? "center" : "flex-start",
            }}
          >
            {element.text}
          </div>
        );

      case "Image":
        return (
          <img
            key={element.id}
            src={element.src}
            alt={element.id}
            style={{
              ...style,
              objectFit: "cover",
              borderRadius: element.borderRadius || 0,
            }}
          />
        );

      default:
        return null;
    }
  };

  // Simple video player with timeline
  const VideoPlayer = ({ elements, duration }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
      let interval;
      if (isPlaying) {
        interval = setInterval(() => {
          setCurrentTime((prev) => {
            if (prev >= duration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 0.1;
          });
        }, 100);
      }
      return () => clearInterval(interval);
    }, [isPlaying, duration]);

    return (
      <div
        style={{
          width: "100%",
          height: "600px",
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        {/* Hidden canvas for video export */}
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
          width="1920"
          height="1080"
        />

        {/* Video Canvas */}
        <div
          style={{
            width: "100%",
            height: "500px",
            position: "relative",
            backgroundColor: "#fff",
            overflow: "hidden",
            transform: "scale(0.5)",
            transformOrigin: "top left",
          }}
        >
          {elements.map((element) => (
            <TimelineElement
              key={element.id}
              element={element}
              currentTime={currentTime}
            />
          ))}
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "10px",
            backgroundColor: "#333",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: "5px 15px",
              backgroundColor: "#a81c1b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>

          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />

          <span style={{ color: "white", fontSize: "14px" }}>
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        </div>
      </div>
    );
  };

  const generateVideo = async () => {
    // Validate required props
    if (!doctorAudio || typeof doctorAudio.duration !== "number") {
      setError(
        "Invalid doctorAudio prop. Expected object with duration property.",
      );
      return;
    }

    if (!photo) {
      setError("Doctor photo is required");
      return;
    }

    setIsRendering(true);
    setError(null);
    setProgress(0);
    setProgressText("Initializing...");

    try {
      updateProgress(10, "Processing video parameters...");

      const audioDurationSeconds = doctorAudio.duration;
      const lang = language.toLowerCase();

      function sanitizeDoctorName(originalName) {
        return originalName.replace(/^Dr\.?\s*/i, "");
      }

      let originalName = name;
      const allowedSpecialities = [
        "Gastroenterologist",
        "Physician",
        "Gastro Surgeon",
      ];
      if (!allowedSpecialities.includes(speciality)) {
        originalName = sanitizeDoctorName(originalName);
      }

      updateProgress(30, "Loading doctor image...");

      // Validate image
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setPreviewImage(photo);
          resolve();
        };
        img.onerror = () => reject(new Error("Failed to load doctor image"));
        img.src = photo;
      });

      updateProgress(50, "Creating timeline elements...");

      // Create timeline configuration for IBD video
      const videoWidth = 1920;
      const videoHeight = 1080;

      const elements = [
        // Background layer
        {
          id: "background",
          type: "Rectangle",
          startTime: 0,
          duration: 15 + audioDurationSeconds + 4.17,
          x: 0,
          y: 0,
          width: videoWidth,
          height: videoHeight,
          fill: "#ffffff",
          zIndex: 0,
        },

        // Part 1 placeholder (0-5 seconds)
        {
          id: "part1-bg",
          type: "Rectangle",
          startTime: 0,
          duration: 5,
          x: 0,
          y: 0,
          width: videoWidth,
          height: videoHeight,
          fill: "#1a1a1a",
          zIndex: 1,
        },
        {
          id: "part1-text",
          type: "Text",
          startTime: 0,
          duration: 5,
          x: videoWidth / 2 - 100,
          y: videoHeight / 2,
          width: 200,
          height: 60,
          text: "IBD Part 1",
          fontSize: 48,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#ffffff",
          textAlign: "center",
          zIndex: 2,
        },

        // Gender/Language placeholder (5-15 seconds)
        {
          id: "path-bg",
          type: "Rectangle",
          startTime: 5,
          duration: 10,
          x: 0,
          y: 0,
          width: videoWidth,
          height: videoHeight,
          fill: "#2a2a2a",
          zIndex: 1,
        },
        {
          id: "path-text",
          type: "Text",
          startTime: 5,
          duration: 10,
          x: videoWidth / 2 - 150,
          y: videoHeight / 2,
          width: 300,
          height: 60,
          text: `${gender} - ${language}`,
          fontSize: 48,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#ffffff",
          textAlign: "center",
          zIndex: 2,
        },

        // Purple border for photo
        {
          id: "photo-border",
          type: "Rectangle",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 92,
          y: 44,
          width: 280,
          height: 280,
          fill: "#a855f7",
          zIndex: 3,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -280 },
              to: { x: 92 },
            },
          ],
        },

        // Doctor photo
        {
          id: "doctor-photo",
          type: "Image",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 96,
          y: 48,
          width: 272,
          height: 272,
          src: photo,
          zIndex: 4,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -272 },
              to: { x: 96 },
            },
            {
              type: "fadeIn",
              duration: 0.5,
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          ],
        },

        // Doctor name
        {
          id: "doctor-name",
          type: "Text",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 96,
          y: 380,
          width: 800,
          height: 80,
          text: originalName,
          fontSize: 72,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#a81c1b",
          zIndex: 5,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -500 },
              to: { x: 96 },
            },
          ],
        },

        // Black separator line
        {
          id: "separator",
          type: "Rectangle",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 96,
          y: 430,
          width: 600,
          height: 4,
          fill: "#000000",
          zIndex: 5,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -600 },
              to: { x: 96 },
            },
          ],
        },

        // Specialty text
        {
          id: "specialty",
          type: "Text",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 104,
          y: 480,
          width: 600,
          height: 70,
          text: speciality,
          fontSize: 60,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#292929",
          zIndex: 5,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -500 },
              to: { x: 104 },
            },
          ],
        },

        // Clinic name
        {
          id: "clinic-name",
          type: "Text",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 104,
          y: 580,
          width: 800,
          height: 70,
          text: clinic_name,
          fontSize: 60,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#292929",
          zIndex: 5,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -500 },
              to: { x: 104 },
            },
          ],
        },

        // Clinic address
        {
          id: "clinic-address",
          type: "Text",
          startTime: 15,
          duration: audioDurationSeconds,
          x: 104,
          y: 650,
          width: 800,
          height: 50,
          text: clinic_address,
          fontSize: 36,
          fontFamily: "Arial",
          fontWeight: "600",
          fill: "#000000",
          zIndex: 5,
          animations: [
            {
              type: "slideIn",
              duration: 0.83,
              from: { x: -500 },
              to: { x: 104 },
            },
          ],
        },

        // Main video placeholder
        {
          id: "main-video-bg",
          type: "Rectangle",
          startTime: 15 + audioDurationSeconds,
          duration: 4.17,
          x: 0,
          y: 0,
          width: videoWidth,
          height: videoHeight,
          fill: "#3a3a3a",
          zIndex: 1,
        },
        {
          id: "main-video-text",
          type: "Text",
          startTime: 15 + audioDurationSeconds,
          duration: 4.17,
          x: videoWidth / 2 - 200,
          y: videoHeight / 2,
          width: 400,
          height: 60,
          text: `Main Video - ${gender} ${language}`,
          fontSize: 48,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#ffffff",
          textAlign: "center",
          zIndex: 2,
        },
      ];

      updateProgress(80, "Finalizing timeline...");
      setTimelineElements(elements);

      updateProgress(100, "Timeline ready!");

      setTimeout(() => {
        setIsRendering(false);
        setProgress(0);
        setProgressText("");
      }, 500);
    } catch (error) {
      console.error("Error generating video:", error);
      setError(error.message || "Error generating video");
      setIsRendering(false);
      setProgress(0);
      setProgressText("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2>IBD Video Generator (Browser Export)</h2>

        {error && (
          <div
            style={{
              color: "red",
              backgroundColor: "#ffe6e6",
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "4px",
              border: "1px solid #ff9999",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Image Preview for Debugging */}
        {previewImage && (
          <div style={{ marginBottom: "20px" }}>
            <h4>Doctor Image Preview:</h4>
            <img
              src={previewImage}
              alt="Doctor preview"
              style={{
                width: "200px",
                height: "200px",
                objectFit: "cover",
                border: "2px solid #a855f7",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={generateVideo}
            disabled={isRendering}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: isRendering ? "#ccc" : "#a81c1b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isRendering ? "not-allowed" : "pointer",
              width: "100%",
              maxWidth: "400px",
              position: "relative",
              overflow: "hidden",
              marginRight: "10px",
            }}
          >
            {isRendering && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  width: `${progress}%`,
                  transition: "width 0.3s ease-out",
                  zIndex: 1,
                }}
              />
            )}

            <span style={{ position: "relative", zIndex: 2 }}>
              {isRendering
                ? `${progressText} (${progress}%)`
                : "Generate IBD Timeline"}
            </span>
          </button>

          {isRendering && (
            <>
              <div
                style={{
                  marginTop: "10px",
                  width: "100%",
                  maxWidth: "400px",
                  margin: "10px auto 0",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "4px",
                  overflow: "hidden",
                  height: "8px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "#a81c1b",
                    width: `${progress}%`,
                    transition: "width 0.3s ease-out",
                    borderRadius: "4px",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                {progressText} ({progress}%)
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
          <p>
            <strong>Doctor:</strong> {name}
          </p>
          <p>
            <strong>Specialty:</strong> {speciality}
          </p>
          <p>
            <strong>Language:</strong> {language}
          </p>
          <p>
            <strong>Audio Duration:</strong> {doctorAudio?.duration || "N/A"}s
          </p>
          <p>
            <strong>Audio URL:</strong>{" "}
            {doctorAudio?.downloadUrl ? "✓ Provided" : "✗ Missing"}
          </p>
          <p>
            <strong>Photo URL:</strong> {photo ? "✓ Provided" : "✗ Missing"}
          </p>
        </div>
      </div>

      {/* Custom Video Player */}
      {timelineElements.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
            Video Preview & Export
          </h3>
          <VideoPlayer
            elements={timelineElements}
            duration={15 + doctorAudio.duration + 4.17}
          />

          {/* Export Controls */}
          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                padding: "15px 25px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isExporting ? "not-allowed" : "pointer",
                fontSize: "16px",
                position: "relative",
                minWidth: "200px",
              }}
              onClick={exportVideo}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      width: `${exportProgress}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                  <span style={{ position: "relative", zIndex: 2 }}>
                    Exporting... {exportProgress.toFixed(0)}%
                  </span>
                </>
              ) : (
                "📹 Export Video (MediaRecorder)"
              )}
            </button>

            <button
              style={{
                padding: "15px 25px",
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isExporting ? "not-allowed" : "pointer",
                fontSize: "16px",
                minWidth: "200px",
              }}
              onClick={exportVideoWebCodecs}
              disabled={isExporting}
            >
              ⚡ Export Fast (WebCodecs)
            </button>
          </div>

          {isExporting && (
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <div
                style={{
                  width: "80%",
                  maxWidth: "500px",
                  margin: "0 auto",
                  backgroundColor: "#e0e0e0",
                  borderRadius: "10px",
                  overflow: "hidden",
                  height: "20px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "#28a745",
                    width: `${exportProgress}%`,
                    transition: "width 0.3s ease",
                    borderRadius: "10px",
                  }}
                />
              </div>
              <p style={{ marginTop: "10px", color: "#666" }}>
                Rendering frame by frame... This may take a few minutes.
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
              Export Options:
            </h4>
            <p>
              <strong>📹 MediaRecorder:</strong> Better browser support, records
              in real-time[73][76][78][80]
            </p>
            <p>
              <strong>⚡ WebCodecs:</strong> Faster than real-time rendering,
              newer browsers only[71][74][87]
            </p>
            <p>
              <strong>Output:</strong> WebM format (widely supported), includes
              audio if provided
            </p>
          </div>
        </div>
      )}

      {/* Hidden audio element for playback */}
      {doctorAudio.downloadUrl && (
        <audio
          ref={audioRef}
          src={doctorAudio.downloadUrl}
          style={{ display: "none" }}
        />
      )}
    </div>
  );
};

export default IBDVideoGenerator;

// usage

// const sampleData = {
//     name: "Dr. John Smith",
//     photo:
//       "https://static.vecteezy.com/system/resources/thumbnails/026/375/249/small_2x/ai-generative-portrait-of-confident-male-doctor-in-white-coat-and-stethoscope-standing-with-arms-crossed-and-looking-at-camera-photo.jpg",
//     gender: "Male",
//     speciality: "Gastroenterologist",
//     clinic_name: "City Medical Center",
//     clinic_address: "123 Medical Street, City Name",
//     doctorAudio: {
//       downloadUrl: "/500-KB-MP3.mp3",
//       duration: 10, // Duration in seconds
//       text: "Audio transcript",
//     },
//     language: "english",
//   };

//    <VideoGenerator {...sampleData} />
