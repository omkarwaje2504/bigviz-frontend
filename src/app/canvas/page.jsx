"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css"; // For custom styles if needed

const CertificateDesigner = () => {
  // Core state
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [elements, setElements] = useState([]);
  const [currentElement, setCurrentElement] = useState(null);
  const [qrEnabled, setQrEnabled] = useState(false);
  const [fonts, setFonts] = useState(["Arial", "Times New Roman", "Helvetica"]);
  const [uploadedImages, setUploadedImages] = useState(new Map());
  const [elementCounter, setElementCounter] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [outputSettings, setOutputSettings] = useState({
    outputDir: "./output",
    fileNameField: "",
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  // Add these new state variables
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [processedCount, setProcessedCount] = useState(0);

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasContainerDimensions, setCanvasContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setCanvasContainerDimensions({ width, height });
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const calculateOptimalZoom = useCallback(
    (canvasWidth, canvasHeight) => {
      if (!canvasContainerDimensions.width || !canvasContainerDimensions.height)
        return 1;

      // Leave some padding (90% of container size)
      const maxWidth = canvasContainerDimensions.width * 0.9;
      const maxHeight = canvasContainerDimensions.height * 0.9;

      // Calculate zoom ratios for both dimensions
      const zoomX = maxWidth / canvasWidth;
      const zoomY = maxHeight / canvasHeight;

      // Use the smaller zoom to ensure canvas fits in both dimensions
      const optimalZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%

      return Math.max(optimalZoom, 0.1); // Minimum zoom of 10%
    },
    [canvasContainerDimensions],
  );

  // Auto-zoom when canvas dimensions change
  useEffect(() => {
    if (backgroundImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const optimalZoom = calculateOptimalZoom(canvas.width, canvas.height);
      setCanvasZoom(optimalZoom);
    }
  }, [backgroundImage, calculateOptimalZoom]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault();
            setCanvasZoom((prev) => Math.min(prev + 0.1, 2));
            break;
          case "-":
            event.preventDefault();
            setCanvasZoom((prev) => Math.max(prev - 0.1, 0.1));
            break;
          case "0":
            event.preventDefault();
            if (backgroundImage && canvasRef.current) {
              const canvas = canvasRef.current;
              const optimalZoom = calculateOptimalZoom(
                canvas.width,
                canvas.height,
              );
              setCanvasZoom(optimalZoom);
            }
            break;
          case "1":
            event.preventDefault();
            setCanvasZoom(1);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [backgroundImage, calculateOptimalZoom]);

  // Refs
  const canvasRef = useRef(null);
  const backgroundFileRef = useRef(null);
  const csvFileRef = useRef(null);
  const fontFilesRef = useRef(null);
  const imageFileRef = useRef(null);
  const configImportRef = useRef(null);

  const getSelectedRowValue = useCallback(
    (fieldName) => {
      if (csvData.length === 0) return "No data";
      if (selectedRowIndex >= csvData.length) return "Invalid row";
      const selectedRow = csvData[selectedRowIndex];
      return selectedRow[fieldName] || "No value";
    },
    [csvData, selectedRowIndex],
  );

  // Helper Functions
  const getRandomValue = useCallback(
    (fieldName) => {
      if (csvData.length === 0) return "No data";
      const values = csvData
        .map((row) => row[fieldName])
        .filter((val) => val && val.trim() !== "");
      if (values.length === 0) return "No values";
      return values[Math.floor(Math.random() * values.length)];
    },
    [csvData],
  );

  const getMaxLayer = useCallback(() => {
    return elements.length > 0 ? Math.max(...elements.map((e) => e.layer)) : -1;
  }, [elements]);

  const getNextLayer = useCallback(() => {
    if (elements.length === 0) return 1;
    return Math.max(...elements.map((e) => e.layer)) + 1;
  }, [elements]);

  const drawResizeHandles = (ctx, x, y, width, height) => {
    const handleSize = 8;
    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2 }, // Top-left
      { x: x + width - handleSize / 2, y: y - handleSize / 2 }, // Top-right
      { x: x - handleSize / 2, y: y + height - handleSize / 2 }, // Bottom-left
      { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }, // Bottom-right
      { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2 }, // Top-center
      { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2 }, // Bottom-center
      { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // Left-center
      { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // Right-center
    ];

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 2;

    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  const drawImageElement = (ctx, element) => {
    if (!element.imageObject) return;

    ctx.save();
    ctx.globalAlpha = element.opacity || 1;

    if (element.rotation) {
      ctx.translate(
        element.x + element.width / 2,
        element.y + element.height / 2,
      );
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.width / 2, -element.height / 2);
      ctx.drawImage(element.imageObject, 0, 0, element.width, element.height);
    } else {
      ctx.drawImage(
        element.imageObject,
        element.x,
        element.y,
        element.width,
        element.height,
      );
    }

    // Selection border
    if (element === currentElement) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#007bff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        element.x - 5,
        element.y - 5,
        element.width + 10,
        element.height + 10,
      );
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const drawQRElement = (ctx, element) => {
    // Draw placeholder rectangle
    ctx.fillStyle =
      element === currentElement
        ? "rgba(0, 255, 0, 0.4)"
        : "rgba(0, 200, 0, 0.3)";
    ctx.fillRect(element.x, element.y, element.width, element.height);

    // Draw border
    ctx.strokeStyle = element === currentElement ? "#00ff00" : "#00cc00";
    ctx.lineWidth = 2;
    ctx.strokeRect(element.x, element.y, element.width, element.height);

    // Draw labels
    ctx.fillStyle = "#000000";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "QR CODE",
      element.x + element.width / 2,
      element.y + element.height / 2 - 8,
    );

    const fieldText = element.csvField || "No field mapped";
    ctx.font = "12px Arial";
    ctx.fillText(
      fieldText,
      element.x + element.width / 2,
      element.y + element.height / 2 + 8,
    );
  };

  const drawTextElement = (ctx, element) => {
    ctx.save();

    if (element.rotation) {
      ctx.translate(element.x, element.y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.x, -element.y);
    }

    ctx.fillStyle = `#${element.color}`;
    ctx.font = `${element.bold ? "bold " : ""}${element.fontSize}px ${element.fontFamily}`;
    ctx.textAlign = element.alignment || "left";

    // Set vertical alignment
    const verticalAlignment = element.verticalAlignment || "top";
    ctx.textBaseline =
      verticalAlignment === "middle"
        ? "middle"
        : verticalAlignment === "bottom"
          ? "bottom"
          : "top";

    // Use selected row data instead of random data
    const displayText = element.csvField
      ? getSelectedRowValue(element.csvField)
      : element.name;

    let textBounds = { width: 0, height: 0 };
    let adjustedY = element.y;

    // Adjust Y position based on vertical alignment for wrapped text
    if (element.wrapText && element.maxWidth) {
      const lineHeight =
        element.fontSize * (element.lineHeightMultiplier || 1.2);
      const lines = getWrappedTextLines(displayText, element.maxWidth, ctx);
      const totalHeight = lines.length * lineHeight;

      if (verticalAlignment === "middle") {
        adjustedY = element.y - totalHeight / 2;
      } else if (verticalAlignment === "bottom") {
        adjustedY = element.y - totalHeight;
      }

      textBounds = drawWrappedText(
        ctx,
        displayText,
        element.x,
        adjustedY,
        element.maxWidth,
        lineHeight,
      );
    } else {
      ctx.fillText(displayText, element.x, adjustedY);
      const metrics = ctx.measureText(displayText);
      textBounds = { width: metrics.width, height: element.fontSize };
    }

    // Draw selection border or text wrapping area border
    if (element === currentElement || element.wrapText) {
      ctx.save();

      if (element === currentElement) {
        ctx.strokeStyle = "#007bff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
      } else if (element.wrapText) {
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }

      if (element.wrapText && element.maxWidth) {
        const rectX =
          element.alignment === "center"
            ? element.x - element.maxWidth / 2
            : element.alignment === "right"
              ? element.x - element.maxWidth
              : element.x;

        ctx.strokeRect(
          rectX - 5,
          adjustedY - 5,
          element.maxWidth + 10,
          textBounds.height + 10,
        );

        if (element === currentElement) {
          drawResizeHandles(
            ctx,
            rectX - 5,
            adjustedY - 5,
            element.maxWidth + 10,
            textBounds.height + 10,
          );
        }
      } else {
        ctx.strokeRect(
          element.x - 5,
          adjustedY - 5,
          textBounds.width + 10,
          textBounds.height + 10,
        );
      }

      ctx.restore();
    }

    ctx.restore();
  };

  const drawPhotoElement = (ctx, element) => {
    // Check if image is loading
    if (loadingImages.has(element.id)) {
      // Draw loading placeholder
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.fillRect(element.x, element.y, element.width, element.height);

      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(element.x, element.y, element.width, element.height);

      // Draw loading spinner
      drawLoadingSpinner(
        ctx,
        element.x + element.width / 2,
        element.y + element.height / 2,
      );

      ctx.fillStyle = "#000000";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Loading...",
        element.x + element.width / 2,
        element.y + element.height / 2 + 30,
      );
      return;
    }

    // Draw actual photo if loaded
    if (element.photoObject) {
      ctx.save();
      ctx.globalAlpha = element.opacity || 1;

      // Apply border radius if specified
      if (element.borderRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(
          element.x,
          element.y,
          element.width,
          element.height,
          element.borderRadius,
        );
        ctx.clip();
      }

      ctx.drawImage(
        element.photoObject,
        element.x,
        element.y,
        element.width,
        element.height,
      );

      // Draw border if specified
      if (element.borderWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = `#${element.borderColor}`;
        ctx.lineWidth = element.borderWidth;
        ctx.strokeRect(element.x, element.y, element.width, element.height);
      }

      ctx.restore();
    } else {
      // Draw placeholder rectangle
      ctx.fillStyle =
        element === currentElement
          ? "rgba(255, 100, 100, 0.3)"
          : "rgba(100, 100, 255, 0.3)";
      ctx.fillRect(element.x, element.y, element.width, element.height);

      // Draw border
      ctx.strokeStyle = element === currentElement ? "#ff0000" : "#6666ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(element.x, element.y, element.width, element.height);

      // Draw labels
      ctx.fillStyle = "#000000";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "PHOTO",
        element.x + element.width / 2,
        element.y + element.height / 2 - 8,
      );

      const fieldText = element.csvField || "No field mapped";
      ctx.font = "12px Arial";
      ctx.fillText(
        fieldText,
        element.x + element.width / 2,
        element.y + element.height / 2 + 8,
      );
    }

    // Selection border
    if (element === currentElement) {
      ctx.strokeStyle = "#007bff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        element.x - 5,
        element.y - 5,
        element.width + 10,
        element.height + 10,
      );
      ctx.setLineDash([]);
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort ALL elements by layer for proper rendering (including behind background)
    const sortedElements = [...elements]
      .filter((e) => e.visible)
      .sort((a, b) => a.layer - b.layer); // Lower layers drawn first (behind)

    // Draw elements in layer order
    sortedElements.forEach((element) => {
      switch (element.type) {
        case "background":
          ctx.save();
          ctx.globalAlpha = element.opacity || 1;
          if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0);
          }
          ctx.restore();
          break;
        case "text":
          drawTextElement(ctx, element);
          break;
        case "image":
          drawImageElement(ctx, element);
          break;
        case "photo":
          drawPhotoElement(ctx, element);
          break;
        case "qr":
          drawQRElement(ctx, element);
          break;
      }
    });
  }, [
    elements,
    backgroundImage,
    currentElement,
    drawTextElement,
    drawPhotoElement,
  ]);

  // Helper function to get wrapped text lines
  const getWrappedTextLines = (text, maxWidth, ctx) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    return lines;
  };

  // Loading spinner animation
  const drawLoadingSpinner = (ctx, centerX, centerY) => {
    const radius = 15;
    const lineWidth = 3;
    const time = Date.now() / 100;

    ctx.save();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + time;
      const opacity = (i + 1) / 8;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(radius - 5, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  };

  const loadPhotoForElement = useCallback(async (element, photoPath) => {
    if (!photoPath || loadingImages.has(element.id)) return;

    setLoadingImages((prev) => new Set([...prev, element.id]));

    try {
      const img = new Image();
      img.crossOrigin = "anonymous"; // For CORS

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;

        // Handle different path types
        if (
          photoPath.startsWith("http://") ||
          photoPath.startsWith("https://")
        ) {
          img.src = photoPath;
        } else {
          // For local files, you might need to handle this differently
          // This is a simplified approach
          img.src = photoPath;
        }
      });

      // Update element with loaded image
      setElements((prev) =>
        prev.map((e) => (e.id === element.id ? { ...e, photoObject: img } : e)),
      );
    } catch (error) {
      console.error("Failed to load photo:", error);
      // Handle error - maybe show error placeholder
    } finally {
      setLoadingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(element.id);
        return newSet;
      });
    }
  }, []);

  const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    let maxLineWidth = 0;
    let totalLines = 0;

    // Adjust x position based on alignment
    let adjustedX = x;
    if (ctx.textAlign === "center") {
      adjustedX = x;
    } else if (ctx.textAlign === "right") {
      adjustedX = x;
    }

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, adjustedX, currentY);
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        line = words[n] + " ";
        currentY += lineHeight;
        totalLines++;
      } else {
        line = testLine;
      }
    }

    // Draw the last line
    ctx.fillText(line, adjustedX, currentY);
    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
    totalLines++;

    // Return actual bounds of the wrapped text
    return {
      width: Math.min(maxLineWidth, maxWidth),
      height: totalLines * lineHeight,
    };
  };

  // File handling functions
  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;

        const optimalZoom = calculateOptimalZoom(img.width, img.height);
        setCanvasZoom(optimalZoom);

        // Add/update background element - start at layer 0 but allow it to move
        setElements((prev) => {
          const filtered = prev.filter((e) => e.type !== "background");
          const backgroundElement = {
            id: "background",
            type: "background",
            name: "Background Image",
            layer: 0, // Default to 0 but can be changed
            visible: true,
            locked: false,
            opacity: 1,
          };
          return [backgroundElement, ...filtered];
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length === 0) return;

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      data.push(row);
    }

    setCsvHeaders(headers);
    setCsvData(data);
  };

  // Element creation functions
  const addTextElement = () => {
    if (csvHeaders.length === 0) {
      alert("Please upload CSV file first");
      return;
    }

    const element = {
      id: elementCounter,
      type: "text",
      name: "New Text",
      csvField: "",
      x: 100,
      y: 100,
      fontSize: 90,
      fontFamily: "Arial",
      color: "ffffff",
      bold: true,
      alignment: "left",
      rotation: 0,
      wrapText: false,
      maxWidth: 800,
      layer: getNextLayer(),
      visible: true,
      locked: false,
      condition: null,
    };

    setElements((prev) => [...prev, element]);
    setCurrentElement(element);
    setElementCounter((prev) => prev + 1);
  };

  const addImageElement = () => {
    const element = {
      id: elementCounter,
      type: "image",
      name: "New Image",
      x: 200,
      y: 200,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      imageData: null,
      imageObject: null,
      layer: getNextLayer(),
      visible: true,
      locked: false,
      condition: null,
    };

    setElements((prev) => [...prev, element]);
    setCurrentElement(element);
    setElementCounter((prev) => prev + 1);
  };

  const addPhotoElement = () => {
    if (csvHeaders.length === 0) {
      alert("Please upload CSV file first");
      return;
    }

    const element = {
      id: elementCounter,
      type: "photo",
      name: "Participant Photo",
      csvField: "",
      x: 157,
      y: 146,
      width: 578,
      height: 578,
      borderWidth: 0,
      borderColor: "000000",
      borderRadius: 0,
      // Start at layer 1 (background is 0)
      layer: Math.max(1, getNextLayer()),
      visible: true,
      locked: false,
    };

    setElements((prev) => [...prev, element]);
    setCurrentElement(element);
    setElementCounter((prev) => prev + 1);
  };

  const toggleQR = () => {
    if (!qrEnabled) {
      const element = {
        id: "qr",
        type: "qr",
        name: "QR Code",
        csvField: "",
        x: 1916,
        y: 188,
        width: 331,
        height: 331,
        layer: getNextLayer(),
        visible: true,
        locked: false,
      };

      setElements((prev) => [...prev, element]);
      setCurrentElement(element);
      setQrEnabled(true);
    } else {
      setElements((prev) => prev.filter((e) => e.type !== "qr"));
      setQrEnabled(false);
      if (currentElement?.type === "qr") {
        setCurrentElement(null);
      }
    }
  };

  // Layer management functions
  const moveElementDown = (id) => {
    setElements((prev) => {
      const element = prev.find((e) => e.id === id);
      if (!element) return prev;

      // Get all layers sorted
      const allLayers = [...prev.map((e) => e.layer)].sort((a, b) => a - b);
      const currentLayerIndex = allLayers.indexOf(element.layer);

      // If already at the lowest layer, do nothing
      if (currentLayerIndex === 0) return prev;

      // Get the next lower layer
      const nextLowerLayer = allLayers[currentLayerIndex - 1];

      // Find element at that layer and swap
      const elementBelow = prev.find(
        (e) => e.layer === nextLowerLayer && e.id !== element.id,
      );

      return prev.map((e) => {
        if (e.id === element.id) return { ...e, layer: nextLowerLayer };
        if (elementBelow && e.id === elementBelow.id)
          return { ...e, layer: element.layer };
        return e;
      });
    });
  };
  const moveElementUp = (id) => {
    setElements((prev) => {
      const element = prev.find((e) => e.id === id);
      if (!element) return prev;

      // Get all layers sorted
      const allLayers = [...prev.map((e) => e.layer)].sort((a, b) => a - b);
      const currentLayerIndex = allLayers.indexOf(element.layer);

      // If already at the highest layer, do nothing
      if (currentLayerIndex === allLayers.length - 1) return prev;

      // Get the next higher layer
      const nextHigherLayer = allLayers[currentLayerIndex + 1];

      // Find element at that layer and swap
      const elementAbove = prev.find(
        (e) => e.layer === nextHigherLayer && e.id !== element.id,
      );

      return prev.map((e) => {
        if (e.id === element.id) return { ...e, layer: nextHigherLayer };
        if (elementAbove && e.id === elementAbove.id)
          return { ...e, layer: element.layer };
        return e;
      });
    });
  };

  const toggleElementVisibility = (id) => {
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e)),
    );
  };

  const deleteCurrentElement = () => {
    if (!currentElement || currentElement.type === "background") return;

    setElements((prev) => prev.filter((e) => e.id !== currentElement.id));
    if (currentElement.type === "qr") {
      setQrEnabled(false);
    }
    setCurrentElement(null);
  };

  const duplicateElement = () => {
    if (
      !currentElement ||
      currentElement.type === "background" ||
      currentElement.type === "qr"
    )
      return;

    const copy = {
      ...currentElement,
      id: elementCounter,
      x: currentElement.x + 20,
      y: currentElement.y + 20,
      name: `Copy of ${currentElement.name}`,
      layer: getNextLayer(),
    };

    setElements((prev) => [...prev, copy]);
    setCurrentElement(copy);
    setElementCounter((prev) => prev + 1);
  };

  // Update mouse event handlers to account for zoom
  const handleCanvasMouseDown = (event) => {
    if (!backgroundImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvasZoom;
    const y = (event.clientY - rect.top) / canvasZoom;

    // Check for resize handles first (for text wrapping elements)
    if (
      currentElement &&
      currentElement.type === "text" &&
      currentElement.wrapText
    ) {
      const handle = getResizeHandle(x, y, currentElement);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        return;
      }
    }

    const element = getElementAt(x, y);
    if (element && element.type !== "background") {
      setCurrentElement(element);
      setIsDragging(true);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  };
  const handleCanvasMouseMove = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / canvasZoom);
    const y = Math.round((event.clientY - rect.top) / canvasZoom);

    setMouseCoords({ x, y });

    if (isResizing && currentElement && resizeHandle) {
      // Handle text wrapping area resize
      handleTextWrapResize(x, y, currentElement, resizeHandle);
    } else if (isDragging && currentElement) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setElements((prev) =>
        prev.map((e) =>
          e.id === currentElement.id ? { ...e, x: newX, y: newY } : e,
        ),
      );

      setCurrentElement((prev) => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const getResizeHandle = (x, y, element) => {
    if (!element.wrapText || !element.maxWidth) return null;

    const rectX =
      element.alignment === "center"
        ? element.x - element.maxWidth / 2
        : element.alignment === "right"
          ? element.x - element.maxWidth
          : element.x;
    const rectY = element.y;
    const rectWidth = element.maxWidth;
    const rectHeight = element.fontSize * 3; // Approximate height

    const handleSize = 8;
    const tolerance = 10;

    const handles = [
      { type: "right", x: rectX + rectWidth, y: rectY + rectHeight / 2 },
      { type: "left", x: rectX, y: rectY + rectHeight / 2 },
    ];

    for (let handle of handles) {
      if (
        Math.abs(x - handle.x) < tolerance &&
        Math.abs(y - handle.y) < tolerance
      ) {
        return handle.type;
      }
    }

    return null;
  };

  const handleTextWrapResize = (mouseX, mouseY, element, handle) => {
    let newMaxWidth = element.maxWidth;

    if (handle === "right") {
      const rectX =
        element.alignment === "center"
          ? element.x - element.maxWidth / 2
          : element.alignment === "right"
            ? element.x - element.maxWidth
            : element.x;
      newMaxWidth = Math.max(50, mouseX - rectX);
    } else if (handle === "left") {
      const rectX =
        element.alignment === "center"
          ? element.x - element.maxWidth / 2
          : element.alignment === "right"
            ? element.x - element.maxWidth
            : element.x;
      newMaxWidth = Math.max(50, rectX + element.maxWidth - mouseX);
    }

    setElements((prev) =>
      prev.map((e) =>
        e.id === currentElement.id ? { ...e, maxWidth: newMaxWidth } : e,
      ),
    );

    setCurrentElement((prev) => ({ ...prev, maxWidth: newMaxWidth }));
  };

  const getElementAt = (x, y) => {
    const sortedElements = [...elements]
      .filter((e) => e.visible && e.type !== "background")
      .sort((a, b) => b.layer - a.layer);

    for (let element of sortedElements) {
      if (element.type === "text") {
        const width = element.fontSize * (element.name.length * 0.6);
        const height = element.fontSize;
        if (
          x >= element.x &&
          x <= element.x + width &&
          y >= element.y &&
          y <= element.y + height
        ) {
          return element;
        }
      } else {
        if (
          x >= element.x &&
          x <= element.x + element.width &&
          y >= element.y &&
          y <= element.y + element.height
        ) {
          return element;
        }
      }
    }
    return null;
  };

  // Update canvas when elements change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);
  useEffect(() => {
    elements.forEach((element) => {
      if (element.type === "photo" && element.csvField) {
        const photoPath = getSelectedRowValue(element.csvField);
        if (photoPath && photoPath !== "No data" && photoPath !== "No value") {
          loadPhotoForElement(element, photoPath);
        }
      }
    });
  }, [elements, selectedRowIndex, getSelectedRowValue, loadPhotoForElement]);

  // Batch processing function
  const generateAllCertificates = async () => {
    if (
      !backgroundImage ||
      csvData.length === 0 ||
      !outputSettings.fileNameField
    ) {
      alert(
        "Please ensure:\n- Background image is uploaded\n- CSV data is loaded\n- File name field is selected",
      );
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setProcessingProgress(0);

    const canvas = canvasRef.current;
    const totalRows = csvData.length;

    try {
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const fileName =
          row[outputSettings.fileNameField] || `certificate_${i + 1}`;

        // Create a temporary canvas for this certificate
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        // Process this row's data
        await generateSingleCertificate(tempCtx, row, i);

        // Download the certificate
        const blob = await new Promise((resolve) =>
          tempCanvas.toBlob(resolve, "image/png"),
        );
        downloadBlob(blob, `${fileName}.png`);

        // Update progress
        const processed = i + 1;
        setProcessedCount(processed);
        setProcessingProgress((processed / totalRows) * 100);

        // Small delay to prevent browser freezing
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      alert(`Successfully generated ${totalRows} certificates!`);
    } catch (error) {
      console.error("Error generating certificates:", error);
      alert("Error occurred during generation. Check console for details.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessedCount(0);
    }
  };

  // Generate single certificate
  const generateSingleCertificate = async (ctx, rowData, rowIndex) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0);
    }

    // Sort and draw elements
    const sortedElements = [...elements]
      .filter((e) => e.visible && e.type !== "background")
      .sort((a, b) => a.layer - b.layer);

    for (const element of sortedElements) {
      switch (element.type) {
        case "text":
          await drawTextElementForRow(ctx, element, rowData);
          break;
        case "image":
          drawImageElement(ctx, element);
          break;
        case "photo":
          await drawPhotoElementForRow(ctx, element, rowData);
          break;
        case "qr":
          await drawQRElementForRow(ctx, element, rowData);
          break;
      }
    }
  };

  // Draw text for specific row
  const drawTextElementForRow = async (ctx, element, rowData) => {
    ctx.save();

    if (element.rotation) {
      ctx.translate(element.x, element.y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-element.x, -element.y);
    }

    ctx.fillStyle = `#${element.color}`;
    ctx.font = `${element.bold ? "bold " : ""}${element.fontSize}px ${element.fontFamily}`;
    ctx.textAlign = element.alignment || "left";

    const verticalAlignment = element.verticalAlignment || "top";
    ctx.textBaseline =
      verticalAlignment === "middle"
        ? "middle"
        : verticalAlignment === "bottom"
          ? "bottom"
          : "top";

    const displayText = element.csvField
      ? rowData[element.csvField] || ""
      : element.name;

    if (element.wrapText && element.maxWidth) {
      const lineHeight =
        element.fontSize * (element.lineHeightMultiplier || 1.2);
      const lines = getWrappedTextLines(displayText, element.maxWidth, ctx);
      const totalHeight = lines.length * lineHeight;

      let adjustedY = element.y;
      if (verticalAlignment === "middle") {
        adjustedY = element.y - totalHeight / 2;
      } else if (verticalAlignment === "bottom") {
        adjustedY = element.y - totalHeight;
      }

      drawWrappedText(
        ctx,
        displayText,
        element.x,
        adjustedY,
        element.maxWidth,
        lineHeight,
      );
    } else {
      ctx.fillText(displayText, element.x, element.y);
    }

    ctx.restore();
  };

  // Draw photo for specific row
  const drawPhotoElementForRow = async (ctx, element, rowData) => {
    if (!element.csvField) return;

    const photoPath = rowData[element.csvField];
    if (!photoPath) return;

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photoPath;
      });

      ctx.save();
      ctx.globalAlpha = element.opacity || 1;

      if (element.borderRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(
          element.x,
          element.y,
          element.width,
          element.height,
          element.borderRadius,
        );
        ctx.clip();
      }

      ctx.drawImage(img, element.x, element.y, element.width, element.height);

      if (element.borderWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = `#${element.borderColor}`;
        ctx.lineWidth = element.borderWidth;
        ctx.strokeRect(element.x, element.y, element.width, element.height);
      }

      ctx.restore();
    } catch (error) {
      console.warn("Failed to load photo:", photoPath, error);
    }
  };

  // Generate QR code for specific row
  const drawQRElementForRow = async (ctx, element, rowData) => {
    if (!element.csvField) return;

    const qrData = rowData[element.csvField];
    if (!qrData) return;

    // You'll need to implement QR code generation here
    // For now, just draw a placeholder
    ctx.fillStyle = "rgba(0, 200, 0, 0.3)";
    ctx.fillRect(element.x, element.y, element.width, element.height);

    ctx.strokeStyle = "#00cc00";
    ctx.lineWidth = 2;
    ctx.strokeRect(element.x, element.y, element.width, element.height);

    ctx.fillStyle = "#000000";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "QR CODE",
      element.x + element.width / 2,
      element.y + element.height / 2 - 8,
    );
    ctx.font = "12px Arial";
    ctx.fillText(
      qrData,
      element.x + element.width / 2,
      element.y + element.height / 2 + 8,
    );
  };

  // Download blob as file
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send element to back (layer 1, just above background which is 0)
  const sendToBack = (id) => {
    setElements((prev) => {
      const element = prev.find((e) => e.id === id);
      if (!element) return prev;

      // Get the minimum layer
      const minLayer = Math.min(...prev.map((e) => e.layer));

      // If already at the back, do nothing
      if (element.layer === minLayer) return prev;

      // Send to one layer below the current minimum
      const newLayer = minLayer - 1;

      return prev.map((e) => {
        if (e.id === element.id) return { ...e, layer: newLayer };
        return e;
      });
    });
  };

  // Bring to front
  const bringToFront = (id) => {
    setElements((prev) => {
      const element = prev.find((e) => e.id === id);
      if (!element) return prev;

      // Get the maximum layer
      const maxLayer = Math.max(...prev.map((e) => e.layer));

      // If already at the front, do nothing
      if (element.layer === maxLayer) return prev;

      // Bring to one layer above the current maximum
      const newLayer = maxLayer + 1;

      return prev.map((e) => {
        if (e.id === element.id) return { ...e, layer: newLayer };
        return e;
      });
    });
  };

  // Component JSX
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Certificate Designer Pro
          </h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Export Config
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Import Config
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="grid grid-cols-[300px_1fr_320px] h-[calc(100vh-80px)]">
        {/* Left Panel */}
        <div className="bg-white border-r border-gray-200 overflow-y-auto">
          {/* Step 1: Background Image */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📷 Step 1: Background Image
            </h3>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => backgroundFileRef.current?.click()}
            >
              <div className="text-sm">
                <strong>Click to upload background image</strong>
                <br />
                <small className="text-gray-500">
                  PNG, JPG formats supported
                </small>
              </div>
            </div>
            <input
              ref={backgroundFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
          </div>

          {/* Step 2: CSV Data */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Step 2: CSV Data
            </h3>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => csvFileRef.current?.click()}
            >
              <div className="text-sm">
                <strong>Click to upload CSV file</strong>
                <br />
                <small className="text-gray-500">
                  Contains participant data
                </small>
              </div>
            </div>
            <input
              ref={csvFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />

            {/* CSV Data Preview and Row Selection */}
            {csvData.length > 0 && (
              <div className="mt-4 space-y-4">
                {/* Row Selection Dropdown */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Select Preview Row ({csvData.length} rows available)
                  </label>
                  <select
                    value={selectedRowIndex}
                    onChange={(e) =>
                      setSelectedRowIndex(parseInt(e.target.value))
                    }
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {csvData.map((row, index) => {
                      // Use first available field as identifier
                      const identifier =
                        row[csvHeaders[0]] || `Row ${index + 1}`;
                      return (
                        <option key={index} value={index}>
                          Row {index + 1}: {identifier}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* CSV Info Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      <strong>Total Rows:</strong> {csvData.length}
                    </span>
                    <span>
                      <strong>Columns:</strong> {csvHeaders.length}
                    </span>
                    <span>
                      <strong>Current Row:</strong> {selectedRowIndex + 1}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Fonts */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔤 Step 3: Fonts (Optional)
            </h3>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fontFilesRef.current?.click()}
            >
              <div className="text-sm">
                <strong>Click to upload font files</strong>
                <br />
                <small className="text-gray-500">
                  TTF, OTF formats supported
                </small>
              </div>
            </div>
            <input
              ref={fontFilesRef}
              type="file"
              accept=".ttf,.otf"
              multiple
              className="hidden"
            />
          </div>

          {/* Step 4: Add Elements */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ✏️ Step 4: Add Elements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                onClick={addTextElement}
              >
                Add Text
              </button>
              <button
                className="p-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
                onClick={addImageElement}
              >
                Add Image
              </button>
              <button
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                onClick={addPhotoElement}
              >
                Add Photo
              </button>
              <button
                className="p-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                onClick={toggleQR}
              >
                Toggle QR
              </button>
            </div>
          </div>

          {/* Enhanced Step 5: Layers - Show all elements in proper order */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📚 Step 5: Layers
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                {[...elements]
                  .sort((a, b) => b.layer - a.layer) // Sort by layer, highest first
                  .map((element, index) => {
                    const typeIcons = {
                      background: "🖼️",
                      text: "📝",
                      image: "🖼️",
                      photo: "📷",
                      qr: "🔲",
                    };

                    const isBackground = element.type === "background";
                    const isBehindBackground =
                      !isBackground &&
                      element.layer <
                        (elements.find((e) => e.type === "background")?.layer ||
                          0);

                    return (
                      <div key={element.id}>
                        {/* Show separator line where background is */}
                        {index > 0 &&
                          elements.find((e) => e.type === "background")
                            ?.layer === element.layer && (
                            <div className="flex items-center my-2">
                              <div className="flex-1 h-px bg-red-300"></div>
                              <span className="px-2 text-xs text-red-600 font-medium">
                                Background Layer
                              </span>
                              <div className="flex-1 h-px bg-red-300"></div>
                            </div>
                          )}

                        <div
                          className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                            element === currentElement
                              ? "bg-blue-100 border-l-4 border-blue-500"
                              : "bg-white hover:bg-gray-50"
                          } ${isBehindBackground ? "bg-red-50 border border-red-200" : ""}`}
                          onClick={() => setCurrentElement(element)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {typeIcons[element.type]}
                            </span>
                            <div>
                              <div className="text-sm font-medium flex items-center gap-2">
                                {element.name}
                                {isBehindBackground && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                    Behind BG
                                  </span>
                                )}
                                {isBackground && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    Background
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Layer {element.layer}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Visibility Toggle */}
                            <button
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleElementVisibility(element.id);
                              }}
                              title="Toggle visibility"
                            >
                              {element.visible ? "👁️" : "🚫"}
                            </button>

                            {/* Movement Controls for All Elements */}
                            <>
                              {/* Send to Back */}
                              <button
                                className="p-1 hover:bg-gray-200 rounded transition-colors text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sendToBack(element.id);
                                }}
                                title="Send to back (behind everything)"
                              >
                                ⬇️
                              </button>

                              {/* Move Down */}
                              <button
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveElementDown(element.id);
                                }}
                                title="Move down one layer"
                              >
                                ↓
                              </button>

                              {/* Move Up */}
                              <button
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveElementUp(element.id);
                                }}
                                title="Move up one layer"
                              >
                                ↑
                              </button>

                              {/* Bring to Front */}
                              <button
                                className="p-1 hover:bg-gray-200 rounded transition-colors text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  bringToFront(element.id);
                                }}
                                title="Bring to front (above everything)"
                              >
                                ⬆️
                              </button>
                            </>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Layer Information */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-xs text-blue-800">
                  <div className="font-semibold mb-1">📝 Layer System:</div>
                  <div>• Higher numbers = Front layer (visible on top)</div>
                  <div>• Lower numbers = Back layer (behind others)</div>
                  <div>• Elements can go behind background image</div>
                  <div>
                    •{" "}
                    <span className="px-1 bg-red-100 text-red-700 rounded">
                      Red highlight
                    </span>{" "}
                    = Behind background
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6: Output Settings */}
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📁 Step 6: Output Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Directory
                </label>
                <input
                  type="text"
                  value={outputSettings.outputDir}
                  onChange={(e) =>
                    setOutputSettings((prev) => ({
                      ...prev,
                      outputDir: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name Field *
                </label>
                <select
                  value={outputSettings.fileNameField}
                  onChange={(e) =>
                    setOutputSettings((prev) => ({
                      ...prev,
                      fileNameField: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select CSV field...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stitch Button */}
              <div className="mt-6">
                <button
                  className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                    isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                  onClick={generateAllCertificates}
                  disabled={
                    isProcessing ||
                    !backgroundImage ||
                    csvData.length === 0 ||
                    !outputSettings.fileNameField
                  }
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing ({processedCount}/{csvData.length})
                    </div>
                  ) : (
                    "🧵 Stitch All Certificates"
                  )}
                </button>

                {isProcessing && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-600">
                      {Math.round(processingProgress)}% Complete
                    </div>
                  </div>
                )}
              </div>

              {csvData.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <div className="text-sm text-yellow-800">
                    <strong>📋 Batch Info:</strong>
                    <div className="mt-1 space-y-1">
                      <div>
                        • {csvData.length} certificates will be generated
                      </div>
                      <div>
                        • Files will be named using:{" "}
                        {outputSettings.fileNameField || "Not selected"}
                      </div>
                      <div>• Format: PNG images</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="bg-gray-100 overflow-hidden flex items-center justify-center relative"
        >
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
            <button
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              onClick={() => setCanvasZoom((prev) => Math.min(prev + 0.1, 2))}
              title="Zoom In"
            >
              🔍+
            </button>
            <button
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              onClick={() => setCanvasZoom((prev) => Math.max(prev - 0.1, 0.1))}
              title="Zoom Out"
            >
              🔍-
            </button>
            <button
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
              onClick={() => {
                if (backgroundImage && canvasRef.current) {
                  const canvas = canvasRef.current;
                  const optimalZoom = calculateOptimalZoom(
                    canvas.width,
                    canvas.height,
                  );
                  setCanvasZoom(optimalZoom);
                }
              }}
              title="Fit to Screen"
            >
              📐
            </button>
            <button
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              onClick={() => setCanvasZoom(1)}
              title="Reset Zoom (100%)"
            >
              1:1
            </button>
            <div className="text-xs text-center text-gray-600 mt-1">
              {Math.round(canvasZoom * 100)}%
            </div>
          </div>

          {/* Canvas Container */}
          <div
            className="relative shadow-2xl"
            style={{
              transform: `scale(${canvasZoom})`,
              transformOrigin: "center center",
              transition: "transform 0.3s ease",
            }}
          >
            <canvas
              ref={canvasRef}
              className="cursor-crosshair bg-white border border-gray-300"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              style={{
                maxWidth: "none", // Remove max-width constraint
                maxHeight: "none", // Remove max-height constraint
              }}
            />
          </div>

          {/* Coordinates Display */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            x: {mouseCoords.x}, y: {mouseCoords.y} | Zoom:{" "}
            {Math.round(canvasZoom * 100)}%
          </div>

          {/* Canvas Info */}
          {backgroundImage && canvasRef.current && (
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded text-sm shadow">
              Canvas: {canvasRef.current.width} × {canvasRef.current.height}px
            </div>
          )}
        </div>

        {/* Right Panel - Element Editor */}
        <div className="bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-4">
              {currentElement
                ? `${currentElement.type.charAt(0).toUpperCase() + currentElement.type.slice(1)} Element Editor`
                : "Select an element to edit"}
            </h3>

            {currentElement && currentElement.type === "text" && (
              <TextEditor
                element={currentElement}
                csvHeaders={csvHeaders}
                fonts={fonts}
                getSelectedRowValue={getSelectedRowValue} // Updated prop name
                onUpdate={(updates) => {
                  setElements((prev) =>
                    prev.map((e) =>
                      e.id === currentElement.id ? { ...e, ...updates } : e,
                    ),
                  );
                  setCurrentElement((prev) => ({ ...prev, ...updates }));
                }}
              />
            )}

            {currentElement && currentElement.type === "image" && (
              <ImageEditor
                element={currentElement}
                onUpdate={(updates) => {
                  setElements((prev) =>
                    prev.map((e) =>
                      e.id === currentElement.id ? { ...e, ...updates } : e,
                    ),
                  );
                  setCurrentElement((prev) => ({ ...prev, ...updates }));
                }}
                onImageLoad={(imageObject, imageData) => {
                  const updates = { imageObject, imageData };
                  setElements((prev) =>
                    prev.map((e) =>
                      e.id === currentElement.id ? { ...e, ...updates } : e,
                    ),
                  );
                  setCurrentElement((prev) => ({ ...prev, ...updates }));
                }}
              />
            )}

            {currentElement && currentElement.type === "photo" && (
              <PhotoEditor
                element={currentElement}
                csvHeaders={csvHeaders}
                getSelectedRowValue={getSelectedRowValue} // Updated prop name
                onUpdate={(updates) => {
                  setElements((prev) =>
                    prev.map((e) =>
                      e.id === currentElement.id ? { ...e, ...updates } : e,
                    ),
                  );
                  setCurrentElement((prev) => ({ ...prev, ...updates }));
                }}
              />
            )}

            {currentElement && currentElement.type === "qr" && (
              <QREditor
                element={currentElement}
                csvHeaders={csvHeaders}
                getSelectedRowValue={getSelectedRowValue} // Updated prop name
                onUpdate={(updates) => {
                  setElements((prev) =>
                    prev.map((e) =>
                      e.id === currentElement.id ? { ...e, ...updates } : e,
                    ),
                  );
                  setCurrentElement((prev) => ({ ...prev, ...updates }));
                }}
              />
            )}

            {/* Action Buttons */}
            {currentElement && (
              <div className="mt-6 flex gap-3">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  onClick={() => {
                    /* Apply changes - already handled by onUpdate */
                  }}
                >
                  Apply Changes
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  onClick={deleteCurrentElement}
                >
                  Delete
                </button>
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  onClick={duplicateElement}
                >
                  Duplicate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={configImportRef}
        type="file"
        accept=".json"
        className="hidden"
      />
    </div>
  );
};

// Text Editor Component
const TextEditor = ({
  element,
  csvHeaders,
  fonts,
  getSelectedRowValue,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Element Name
        </label>
        <input
          type="text"
          value={element.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CSV Field
        </label>
        <select
          value={element.csvField}
          onChange={(e) => onUpdate({ csvField: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select field...</option>
          {csvHeaders.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
        {element.csvField && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <strong>Current value:</strong>{" "}
            {getSelectedRowValue(element.csvField)}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position & Size
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            placeholder="X"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            placeholder="Y"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Settings
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.fontSize}
            onChange={(e) =>
              onUpdate({ fontSize: parseInt(e.target.value) || 90 })
            }
            placeholder="Size"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <select
            value={element.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Alignment
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">Horizontal</label>
            <select
              value={element.alignment || "left"}
              onChange={(e) => onUpdate({ alignment: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Vertical</label>
            <select
              value={element.verticalAlignment || "top"}
              onChange={(e) => onUpdate({ verticalAlignment: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={element.bold}
            onChange={(e) => onUpdate({ bold: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Bold</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={element.wrapText}
            onChange={(e) => onUpdate({ wrapText: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Text Wrapping</span>
        </label>
      </div>
      {element.wrapText && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-blue-800">
            Text Wrapping Settings
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Width (pixels)
            </label>
            <input
              type="number"
              value={element.maxWidth}
              onChange={(e) =>
                onUpdate({ maxWidth: parseInt(e.target.value) || 800 })
              }
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              min="50"
              max="2000"
              step="10"
            />
            <div className="text-xs text-gray-500 mt-1">
              Current: {element.maxWidth}px
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Line Height Multiplier
            </label>
            <input
              type="range"
              value={element.lineHeightMultiplier || 1.2}
              onChange={(e) =>
                onUpdate({ lineHeightMultiplier: parseFloat(e.target.value) })
              }
              min="1"
              max="2"
              step="0.1"
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {((element.lineHeightMultiplier || 1.2) * 100).toFixed(0)}% (Line
              height:{" "}
              {Math.round(
                element.fontSize * (element.lineHeightMultiplier || 1.2),
              )}
              px)
            </div>
          </div>

          <div className="bg-white border border-blue-300 rounded p-3">
            <div className="text-xs text-blue-800 space-y-1">
              <div>
                <strong>💡 Text Wrapping Tips:</strong>
              </div>
              <div>• Gray border shows wrapping area on canvas</div>
              <div>• Blue dashed border shows when element is selected</div>
              <div>• Drag resize handles to adjust wrapping width</div>
              <div>• Text alignment affects wrap positioning</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rotation (degrees)
        </label>
        <input
          type="number"
          value={element.rotation}
          onChange={(e) =>
            onUpdate({ rotation: parseInt(e.target.value) || 0 })
          }
          min="0"
          max="360"
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {element.wrapText && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Width
          </label>
          <input
            type="number"
            value={element.maxWidth}
            onChange={(e) =>
              onUpdate({ maxWidth: parseInt(e.target.value) || 800 })
            }
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      )}
    </div>
  );
};

// Image Editor Component
const ImageEditor = ({ element, onUpdate, onImageLoad }) => {
  const imageFileRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageLoad(img, e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Element Name
        </label>
        <input
          type="text"
          value={element.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image File
        </label>
        <input
          ref={imageFileRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {element.imageObject && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            Image loaded successfully
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            placeholder="X"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            placeholder="Y"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Size
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.width}
            onChange={(e) =>
              onUpdate({ width: parseInt(e.target.value) || 200 })
            }
            placeholder="Width"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.height}
            onChange={(e) =>
              onUpdate({ height: parseInt(e.target.value) || 200 })
            }
            placeholder="Height"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rotation (degrees)
        </label>
        <input
          type="number"
          value={element.rotation}
          onChange={(e) =>
            onUpdate({ rotation: parseInt(e.target.value) || 0 })
          }
          min="0"
          max="360"
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opacity: {Math.round(element.opacity * 100)}%
        </label>
        <input
          type="range"
          value={element.opacity}
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          min="0"
          max="1"
          step="0.1"
          className="w-full"
        />
      </div>
    </div>
  );
};

// Photo Editor Component
const PhotoEditor = ({
  element,
  csvHeaders,
  getSelectedRowValue,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Element Name
        </label>
        <input
          type="text"
          value={element.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CSV Field (Photo Path)
        </label>
        <select
          value={element.csvField}
          onChange={(e) => onUpdate({ csvField: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select field...</option>
          {csvHeaders.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
        {element.csvField && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <strong>Photo path:</strong> {getSelectedRowValue(element.csvField)}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            placeholder="X"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            placeholder="Y"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Size
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.width}
            onChange={(e) =>
              onUpdate({ width: parseInt(e.target.value) || 578 })
            }
            placeholder="Width"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.height}
            onChange={(e) =>
              onUpdate({ height: parseInt(e.target.value) || 578 })
            }
            placeholder="Height"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Border Effects
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.borderWidth}
            onChange={(e) =>
              onUpdate({ borderWidth: parseInt(e.target.value) || 0 })
            }
            placeholder="Border Width"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="color"
            value={`#${element.borderColor}`}
            onChange={(e) =>
              onUpdate({ borderColor: e.target.value.replace("#", "") })
            }
            className="w-full h-10 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Border Radius
        </label>
        <input
          type="number"
          value={element.borderRadius}
          onChange={(e) =>
            onUpdate({ borderRadius: parseInt(e.target.value) || 0 })
          }
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm">
          <strong>💡 Photo Preview Tips:</strong>
        </div>
        <ul className="text-xs mt-2 space-y-1 text-blue-800">
          <li>• Use full file paths (e.g., C:/photos/john.jpg)</li>
          <li>• Use web URLs (e.g., https://example.com/photo.jpg)</li>
          <li>• Relative paths work if images are in project folder</li>
        </ul>
      </div>
    </div>
  );
};

// QR Editor Component
const QREditor = ({ element, csvHeaders, getSelectedRowValue, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          QR Data Field
        </label>
        <select
          value={element.csvField}
          onChange={(e) => onUpdate({ csvField: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select CSV field...</option>
          {csvHeaders.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
        {element.csvField && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <strong>QR will contain:</strong>{" "}
            {getSelectedRowValue(element.csvField)}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            placeholder="X"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            placeholder="Y"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Size
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={element.width}
            onChange={(e) =>
              onUpdate({ width: parseInt(e.target.value) || 331 })
            }
            placeholder="Width"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="number"
            value={element.height}
            onChange={(e) =>
              onUpdate({ height: parseInt(e.target.value) || 331 })
            }
            placeholder="Height"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default CertificateDesigner;
