"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Image,
  Text,
  Rect,
  Group,
  Transformer,
  Circle,
  Path,
  Line,
} from "react-konva";
import Konva from "konva";
import QRCode from "qrcode";
import { graphicsLibrary } from "./graphicsLibrary";
import "./App.css";

const DesignStudio = () => {
  // Core state
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [elementCounter, setElementCounter] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [currentTemplateName, setCurrentTemplateName] =
    useState("Untitled Design");
  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState(null);
  const [showGraphicsPanel, setShowGraphicsPanel] = useState(false);
  const [graphicsCategory, setGraphicsCategory] = useState("icons");

  // Konva stage settings
  const [stageSize, setStageSize] = useState({ width: 1050, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Refs
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem("design-templates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Track container dimensions
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate optimal scale
  const calculateOptimalScale = useCallback(
    (canvasWidth, canvasHeight) => {
      if (!containerDimensions.width || !containerDimensions.height) return 1;

      const maxWidth = containerDimensions.width * 0.85;
      const maxHeight = containerDimensions.height * 0.85;

      const scaleX = maxWidth / canvasWidth;
      const scaleY = maxHeight / canvasHeight;

      return Math.min(scaleX, scaleY, 1);
    },
    [containerDimensions],
  );

  // Auto-scale when stage dimensions change
  useEffect(() => {
    const optimalScale = calculateOptimalScale(
      stageSize.width,
      stageSize.height,
    );
    setStageScale(optimalScale);
  }, [stageSize, calculateOptimalScale]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "s") {
          event.preventDefault();
          saveTemplate(false);
        }
        if (event.key === "d") {
          event.preventDefault();
          duplicateElement();
        }
      }
      if (event.key === "Delete" && selectedId) {
        deleteElement(selectedId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const currentElement = elements.find((el) => el.id === selectedId);

  const getNextLayer = useCallback(() => {
    if (elements.length === 0) return 1;
    return Math.max(...elements.map((e) => e.layer || 0)) + 1;
  }, [elements]);

  // File handling
  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setBackgroundImage(img);

        setElements((prev) => {
          const filtered = prev.filter((e) => e.type !== "background");
          const backgroundElement = {
            id: "background",
            type: "background",
            name: "Background Image",
            layer: 0,
            visible: true,
            locked: false,
            opacity: 1,
            image: img,
            imageSrc: e.target.result,
          };
          return [backgroundElement, ...filtered];
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Add text element
  const addTextElement = () => {
    const element = {
      id: `text-${elementCounter}`,
      type: "text",
      name: `Text ${elementCounter}`,
      text: "Type text here",
      x: stageSize.width / 2 - 100,
      y: stageSize.height / 2 - 25,
      fontSize: 48,
      fontFamily: "Arial",
      fill: "#000000",
      fontStyle: "normal",
      align: "left",
      letterSpacing: 0,
      rotation: 0,
      width: null,
      layer: getNextLayer(),
      visible: true,
      locked: false,
      draggable: true,
    };

    setElements((prev) => [...prev, element]);
    setSelectedId(element.id);
    setElementCounter((prev) => prev + 1);
    setActiveTab(null);
  };

  // Add image element
  const addImageElement = () => {
    const element = {
      id: `image-${elementCounter}`,
      type: "image",
      name: `Image ${elementCounter}`,
      x: stageSize.width / 2 - 100,
      y: stageSize.height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      image: null,
      imageSrc: null,
      layer: getNextLayer(),
      visible: true,
      locked: false,
      draggable: true,
    };

    setElements((prev) => [...prev, element]);
    setSelectedId(element.id);
    setElementCounter((prev) => prev + 1);
  };

  // Add graphic from library
  const addGraphicElement = (graphic) => {
    const element = {
      id: `graphic-${elementCounter}`,
      type: "graphic",
      subType: graphic.type,
      name: graphic.name,
      graphicData: graphic,
      x: stageSize.width / 2 - 50,
      y: stageSize.height / 2 - 50,
      width: graphic.width || 100,
      height: graphic.height || 100,
      fill: graphic.fill || "#3b82f6",
      stroke: graphic.stroke || "#1e40af",
      strokeWidth: graphic.strokeWidth || 2,
      rotation: 0,
      opacity: 1,
      layer: getNextLayer(),
      visible: true,
      locked: false,
      draggable: true,
    };

    // If it's an image type, load the image
    if (graphic.type === "image" && graphic.url) {
      loadImage(graphic.url).then((img) => {
        element.image = img;
        element.imageSrc = graphic.url;
        setElements((prev) => [...prev, element]);
        setSelectedId(element.id);
        setElementCounter((prev) => prev + 1);
      });
    } else {
      setElements((prev) => [...prev, element]);
      setSelectedId(element.id);
      setElementCounter((prev) => prev + 1);
    }

    setShowGraphicsPanel(false);
  };

  // Add QR code element
  const addQRElement = async () => {
    const qrData = prompt(
      "Enter URL or text for QR code:",
      "https://example.com",
    );
    if (!qrData) return;

    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const img = await loadImage(qrDataUrl);

      const element = {
        id: `qr-${elementCounter}`,
        type: "qr",
        name: `QR Code ${elementCounter}`,
        x: stageSize.width / 2 - 100,
        y: stageSize.height / 2 - 100,
        width: 200,
        height: 200,
        qrData: qrData,
        image: img,
        imageSrc: qrDataUrl,
        rotation: 0,
        opacity: 1,
        layer: getNextLayer(),
        visible: true,
        locked: false,
        draggable: true,
      };

      setElements((prev) => [...prev, element]);
      setSelectedId(element.id);
      setElementCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code");
    }
  };

  // Update QR code
  const updateQRCode = async (elementId, newData) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(newData, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const img = await loadImage(qrDataUrl);

      setElements((prev) =>
        prev.map((el) =>
          el.id === elementId
            ? {
                ...el,
                qrData: newData,
                image: img,
                imageSrc: qrDataUrl,
              }
            : el,
        ),
      );
    } catch (error) {
      console.error("Failed to update QR code:", error);
    }
  };

  const deleteElement = (id) => {
    if (!id || id === "background") return;
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const duplicateElement = () => {
    if (!currentElement || currentElement.type === "background") return;

    const copy = {
      ...currentElement,
      id: `${currentElement.type}-${elementCounter}`,
      x: currentElement.x + 20,
      y: currentElement.y + 20,
      name: `${currentElement.name} Copy`,
      layer: getNextLayer(),
    };

    setElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setElementCounter((prev) => prev + 1);
  };

  // Template management
  const saveTemplate = (saveAsNew = false) => {
    const templateName = prompt(
      saveAsNew ? "Enter new template name:" : "Save template as:",
      currentTemplateName,
    );
    if (!templateName) return;

    const template = {
      id: saveAsNew
        ? `template-${Date.now()}`
        : currentTemplateId || `template-${Date.now()}`,
      name: templateName,
      timestamp: new Date().toISOString(),
      stageSize,
      elements: elements.map((el) => {
        if (
          el.type === "image" ||
          el.type === "background" ||
          el.type === "graphic" ||
          el.type === "qr"
        ) {
          return { ...el, image: null };
        }
        return el;
      }),
    };

    const updatedTemplates = saveAsNew
      ? [...templates, template]
      : templates.map((t) => (t.id === template.id ? template : t));

    if (!templates.find((t) => t.id === template.id) && !saveAsNew) {
      updatedTemplates.push(template);
    }

    setTemplates(updatedTemplates);
    localStorage.setItem("design-templates", JSON.stringify(updatedTemplates));

    setCurrentTemplateName(templateName);
    setCurrentTemplateId(template.id);

    alert(`Template "${templateName}" saved successfully!`);
  };

  const loadTemplate = async (template) => {
    setCurrentTemplateName(template.name);
    setCurrentTemplateId(template.id);
    setStageSize(template.stageSize);

    const loadedElements = await Promise.all(
      template.elements.map(async (el) => {
        if (
          (el.type === "image" ||
            el.type === "background" ||
            el.type === "graphic") &&
          el.imageSrc
        ) {
          const img = await loadImage(el.imageSrc);
          return { ...el, image: img };
        }
        if (el.type === "qr" && el.qrData) {
          const qrDataUrl = await QRCode.toDataURL(el.qrData, {
            width: 300,
            margin: 1,
          });
          const img = await loadImage(qrDataUrl);
          return { ...el, image: img, imageSrc: qrDataUrl };
        }
        return el;
      }),
    );

    setElements(loadedElements);

    const bgElement = loadedElements.find((el) => el.type === "background");
    if (bgElement && bgElement.image) {
      setBackgroundImage(bgElement.image);
    }

    setSelectedId(null);
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Export functions
  const exportJSON = () => {
    const data = {
      name: currentTemplateName,
      stageSize,
      elements: elements.map((el) => {
        if (
          el.type === "image" ||
          el.type === "background" ||
          el.type === "graphic" ||
          el.type === "qr"
        ) {
          return { ...el, image: null };
        }
        return el;
      }),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentTemplateName.replace(/\s+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importJSON = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await loadTemplate(data);
        alert("Design imported successfully!");
      } catch (error) {
        alert("Error importing JSON: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  const exportImage = () => {
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `${currentTemplateName.replace(/\s+/g, "-")}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const newDesign = () => {
    if (!confirm("Create new design? Unsaved changes will be lost.")) return;
    setElements([]);
    setBackgroundImage(null);
    setCurrentTemplateName("Untitled Design");
    setCurrentTemplateId(null);
    setSelectedId(null);
  };

  // Update transformer
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const node = stageRef.current?.findOne(`#${selectedId}`);
      if (node && node !== transformerRef.current.nodes()[0]) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }

    const clickedElement = elements.find((el) => el.id === e.target.id());
    if (clickedElement && clickedElement.type !== "background") {
      setSelectedId(e.target.id());
    }
  };

  // Render elements
  const renderElements = () => {
    const sortedElements = [...elements].sort(
      (a, b) => (a.layer || 0) - (b.layer || 0),
    );

    return sortedElements.map((element) => {
      if (!element.visible) return null;

      const commonProps = {
        key: element.id,
        id: element.id,
        x: element.x,
        y: element.y,
        rotation: element.rotation || 0,
        draggable: !element.locked && element.type !== "background",
        onDragEnd: (e) => {
          const updatedElements = elements.map((el) =>
            el.id === element.id
              ? { ...el, x: e.target.x(), y: e.target.y() }
              : el,
          );
          setElements(updatedElements);
        },
      };

      switch (element.type) {
        case "background":
          return (
            <Image
              {...commonProps}
              image={element.image}
              opacity={element.opacity}
              listening={false}
            />
          );

        case "text":
          return (
            <Text
              {...commonProps}
              text={element.text}
              fontSize={element.fontSize}
              fontFamily={element.fontFamily}
              fill={element.fill}
              fontStyle={element.fontStyle}
              align={element.align}
              letterSpacing={element.letterSpacing || 0}
              width={element.width}
              onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);

                const updatedElements = elements.map((el) =>
                  el.id === element.id
                    ? {
                        ...el,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        fontSize: Math.max(5, element.fontSize * scaleY),
                      }
                    : el,
                );
                setElements(updatedElements);
              }}
            />
          );

        case "image":
          if (!element.image) {
            return (
              <Rect
                {...commonProps}
                width={element.width}
                height={element.height}
                fill="rgba(200, 200, 200, 0.3)"
                stroke="#999"
                strokeWidth={2}
                dash={[10, 5]}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  node.scaleX(1);
                  node.scaleY(1);

                  const updatedElements = elements.map((el) =>
                    el.id === element.id
                      ? {
                          ...el,
                          x: node.x(),
                          y: node.y(),
                          width: Math.max(5, element.width * scaleX),
                          height: Math.max(5, element.height * scaleY),
                          rotation: node.rotation(),
                        }
                      : el,
                  );
                  setElements(updatedElements);
                }}
              />
            );
          }
          return (
            <Image
              {...commonProps}
              image={element.image}
              width={element.width}
              height={element.height}
              opacity={element.opacity}
              onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);

                const updatedElements = elements.map((el) =>
                  el.id === element.id
                    ? {
                        ...el,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, element.width * scaleX),
                        height: Math.max(5, element.height * scaleY),
                        rotation: node.rotation(),
                      }
                    : el,
                );
                setElements(updatedElements);
              }}
            />
          );

        case "graphic":
          return renderGraphic(element, commonProps);

        case "qr":
          return (
            <Image
              {...commonProps}
              image={element.image}
              width={element.width}
              height={element.height}
              opacity={element.opacity}
              onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);

                const updatedElements = elements.map((el) =>
                  el.id === element.id
                    ? {
                        ...el,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, element.width * scaleX),
                        height: Math.max(5, element.height * scaleY),
                        rotation: node.rotation(),
                      }
                    : el,
                );
                setElements(updatedElements);
              }}
            />
          );

        default:
          return null;
      }
    });
  };

  const renderGraphic = (element, commonProps) => {
    const { graphicData } = element;

    if (!graphicData) return null;

    const handleTransform = (e) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      const updatedElements = elements.map((el) =>
        el.id === element.id
          ? {
              ...el,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, element.width * scaleX),
              height: Math.max(5, element.height * scaleY),
              rotation: node.rotation(),
            }
          : el,
      );
      setElements(updatedElements);
    };

    switch (graphicData.shape) {
      case "circle":
        return (
          <Circle
            {...commonProps}
            radius={element.width / 2}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            opacity={element.opacity}
            onTransformEnd={handleTransform}
          />
        );

      case "rectangle":
        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            cornerRadius={graphicData.cornerRadius || 0}
            opacity={element.opacity}
            onTransformEnd={handleTransform}
          />
        );

      case "triangle":
        const trianglePoints = [
          element.width / 2,
          0,
          element.width,
          element.height,
          0,
          element.height,
        ];
        return (
          <Line
            {...commonProps}
            points={trianglePoints}
            closed
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            opacity={element.opacity}
            onTransformEnd={handleTransform}
          />
        );

      case "star":
        return (
          <Path
            {...commonProps}
            data={graphicData.svgPath}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            scaleX={element.width / 100}
            scaleY={element.height / 100}
            opacity={element.opacity}
            onTransformEnd={handleTransform}
          />
        );

      case "path":
        return (
          <Path
            {...commonProps}
            data={graphicData.svgPath}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            scaleX={element.width / (graphicData.viewBox?.width || 100)}
            scaleY={element.height / (graphicData.viewBox?.height || 100)}
            opacity={element.opacity}
            onTransformEnd={handleTransform}
          />
        );

      case "image":
        if (element.image) {
          return (
            <Image
              {...commonProps}
              image={element.image}
              width={element.width}
              height={element.height}
              opacity={element.opacity}
              onTransformEnd={handleTransform}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-800">My Projects</h1>
          </div>
          <span className="text-gray-400">—</span>
          <input
            type="text"
            value={currentTemplateName}
            onChange={(e) => setCurrentTemplateName(e.target.value)}
            className="px-3 py-1.5 border-0 bg-transparent text-gray-700 focus:outline-none font-medium"
            style={{ minWidth: "200px" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => saveTemplate(false)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>{" "}
            Saving...
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Undo"
          >
            ↶
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Redo"
          >
            ↷
          </button>
          <button
            onClick={exportImage}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
          >
            👁️ Preview
          </button>
          <button
            onClick={newDesign}
            className="px-6 py-2 text-sm font-bold bg-cyan-400 text-white rounded hover:bg-cyan-500 transition-colors"
          >
            Next
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6">
          <button
            onClick={addTextElement}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "text"
                ? "bg-cyan-100 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Add Text"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M9 7v10M15 7v10M6 17h12" />
            </svg>
            <span className="text-xs font-medium">Text</span>
          </button>

          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  const img = new window.Image();
                  img.onload = () => {
                    const element = {
                      id: `image-${elementCounter}`,
                      type: "image",
                      name: `Image ${elementCounter}`,
                      x: stageSize.width / 2 - img.width / 4,
                      y: stageSize.height / 2 - img.height / 4,
                      width: img.width / 2,
                      height: img.height / 2,
                      rotation: 0,
                      opacity: 1,
                      image: img,
                      imageSrc: evt.target.result,
                      layer: getNextLayer(),
                      visible: true,
                      locked: false,
                      draggable: true,
                    };
                    setElements((prev) => [...prev, element]);
                    setSelectedId(element.id);
                    setElementCounter((prev) => prev + 1);
                  };
                  img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
              };
              input.click();
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "uploads"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Upload Image"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-xs">Uploads</span>
          </button>

          <button
            onClick={() => {
              setShowGraphicsPanel(!showGraphicsPanel);
              setActiveTab("graphics");
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "graphics"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Graphics"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6M12 17v6M23 12h-6M7 12H1" />
            </svg>
            <span className="text-xs">Graphics</span>
          </button>

          <button
            onClick={addQRElement}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "qr"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="QR Code"
          >
            <svg width="24" height="24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="text-xs">QR codes</span>
          </button>

          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = handleBackgroundUpload;
              input.click();
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "background"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Background"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 15l6-6 6 6 6-6" />
            </svg>
            <span className="text-xs">Background</span>
          </button>

          <button
            onClick={() => setActiveTab("template")}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "template"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Templates"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
            <span className="text-xs">Template</span>
          </button>
        </div>

        {/* Graphics Panel */}
        {showGraphicsPanel && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Graphics</h2>
                <button
                  onClick={() => setShowGraphicsPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {["icons", "shapes", "images", "illustrations"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGraphicsCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      graphicsCategory === cat
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Graphics grid */}
              <div className="grid grid-cols-3 gap-3">
                {graphicsLibrary[graphicsCategory]?.map((graphic, index) => (
                  <button
                    key={index}
                    onClick={() => addGraphicElement(graphic)}
                    className="aspect-square border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors p-3 flex items-center justify-center"
                    title={graphic.name}
                  >
                    {graphic.type === "image" ? (
                      <img
                        src={graphic.url}
                        alt={graphic.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{
                          __html: `<svg viewBox="0 0 100 100" width="100%" height="100%">${
                            graphic.shape === "circle"
                              ? '<circle cx="50" cy="50" r="40" fill="currentColor" />'
                              : graphic.shape === "rectangle"
                                ? '<rect x="10" y="10" width="80" height="80" fill="currentColor" />'
                                : graphic.shape === "triangle"
                                  ? '<polygon points="50,10 90,90 10,90" fill="currentColor" />'
                                  : `<path d="${graphic.svgPath}" fill="currentColor" />`
                          }</svg>`,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Template Panel */}
        {activeTab === "template" && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Templates</h2>
                <button
                  onClick={() => setActiveTab(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => saveTemplate(false)}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Save Template
                </button>
                <button
                  onClick={() => saveTemplate(true)}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Save As New
                </button>
                <button
                  onClick={exportJSON}
                  className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                >
                  Export JSON
                </button>
                <label className="w-full block">
                  <div className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium text-center cursor-pointer">
                    Import JSON
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importJSON}
                  />
                </label>
              </div>

              {templates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">
                    Saved Templates
                  </h3>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer"
                        onClick={() => {
                          loadTemplate(template);
                          setActiveTab(null);
                        }}
                      >
                        <div className="font-medium text-sm">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(template.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 bg-gray-100 overflow-hidden flex items-center justify-center relative"
        >
          {/* Top Toolbar - Text formatting */}
          {currentElement && currentElement.type === "text" && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200">
              <select
                value={currentElement.fontFamily}
                onChange={(e) => {
                  setElements((prev) =>
                    prev.map((el) =>
                      el.id === currentElement.id
                        ? { ...el, fontFamily: e.target.value }
                        : el,
                    ),
                  );
                }}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
              </select>

              <div className="flex items-center gap-1 border-x border-gray-300 px-2">
                <button
                  onClick={() => {
                    const newSize = Math.max(8, currentElement.fontSize - 2);
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === currentElement.id
                          ? { ...el, fontSize: newSize }
                          : el,
                      ),
                    );
                  }}
                  className="px-2 py-1 hover:bg-gray-100 rounded"
                >
                  −
                </button>
                <input
                  type="number"
                  value={currentElement.fontSize}
                  onChange={(e) => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === currentElement.id
                          ? { ...el, fontSize: parseInt(e.target.value) || 48 }
                          : el,
                      ),
                    );
                  }}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={() => {
                    const newSize = currentElement.fontSize + 2;
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === currentElement.id
                          ? { ...el, fontSize: newSize }
                          : el,
                      ),
                    );
                  }}
                  className="px-2 py-1 hover:bg-gray-100 rounded"
                >
                  +
                </button>
              </div>

              <input
                type="color"
                value={currentElement.fill}
                onChange={(e) => {
                  setElements((prev) =>
                    prev.map((el) =>
                      el.id === currentElement.id
                        ? { ...el, fill: e.target.value }
                        : el,
                    ),
                  );
                }}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />

              <button
                onClick={() => {
                  const newStyle =
                    currentElement.fontStyle === "bold" ? "normal" : "bold";
                  setElements((prev) =>
                    prev.map((el) =>
                      el.id === currentElement.id
                        ? { ...el, fontStyle: newStyle }
                        : el,
                    ),
                  );
                }}
                className={`px-3 py-1 rounded font-bold ${
                  currentElement.fontStyle === "bold"
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                }`}
              >
                B
              </button>

              <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === currentElement.id
                          ? { ...el, align: "left" }
                          : el,
                      ),
                    );
                  }}
                  className={`px-2 py-1 rounded ${currentElement.align === "left" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                >
                  ≡
                </button>
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === currentElement.id
                          ? { ...el, align: "center" }
                          : el,
                      ),
                    );
                  }}
                  className={`px-2 py-1 rounded ${
                    currentElement.align === "center"
                      ? "bg-gray-200"
                      : "hover:bg-gray-100"
                  }`}
                >
                  ≡
                </button>
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === currentElement.id
                          ? { ...el, align: "right" }
                          : el,
                      ),
                    );
                  }}
                  className={`px-2 py-1 rounded ${currentElement.align === "right" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                >
                  ≡
                </button>
              </div>

              <button className="px-3 py-1 rounded hover:bg-gray-100">
                Format
              </button>
              <button className="px-3 py-1 rounded hover:bg-gray-100">
                Effects
              </button>
              <button className="px-2 py-1 rounded hover:bg-gray-100">⋯</button>
            </div>
          )}

          {/* Editable text input overlay */}
          {currentElement && currentElement.type === "text" && (
            <input
              type="text"
              value={currentElement.text}
              onChange={(e) => {
                setElements((prev) =>
                  prev.map((el) =>
                    el.id === currentElement.id
                      ? { ...el, text: e.target.value }
                      : el,
                  ),
                );
              }}
              className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 border-2 border-blue-400 rounded-lg shadow-lg text-center"
              style={{ width: "400px" }}
              placeholder="Type text here"
            />
          )}

          {/* Main canvas */}
          <div
            style={{
              transform: `scale(${stageScale})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              onClick={handleStageClick}
              onTap={handleStageClick}
              style={{ backgroundColor: "white", border: "1px solid #e5e7eb" }}
            >
              <Layer ref={layerRef}>
                {renderElements()}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>

          {/* Bottom zoom controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-3 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200">
            <button
              onClick={() => setStageScale((prev) => Math.max(prev - 0.1, 0.1))}
              className="text-gray-600 hover:text-gray-900 font-bold text-lg"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(stageScale * 100)}%
            </span>
            <button
              onClick={() => setStageScale((prev) => Math.min(prev + 0.1, 2))}
              className="text-gray-600 hover:text-gray-900 font-bold text-lg"
            >
              +
            </button>
            <button
              onClick={() => {
                const optimalScale = calculateOptimalScale(
                  stageSize.width,
                  stageSize.height,
                );
                setStageScale(optimalScale);
              }}
              className="ml-2 p-1.5 hover:bg-gray-100 rounded"
            >
              ⊡
            </button>
          </div>
        </div>

        {/* Right Properties Panel */}
        {currentElement && currentElement.type !== "background" && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Properties</h3>

              {currentElement.type === "text" && (
                <TextPropertiesPanel
                  element={currentElement}
                  onUpdate={(updates) => {
                    setElements((prev) =>
                      prev.map((e) =>
                        e.id === currentElement.id ? { ...e, ...updates } : e,
                      ),
                    );
                  }}
                />
              )}

              {currentElement.type === "image" && (
                <ImagePropertiesPanel
                  element={currentElement}
                  onUpdate={(updates) => {
                    setElements((prev) =>
                      prev.map((e) =>
                        e.id === currentElement.id ? { ...e, ...updates } : e,
                      ),
                    );
                  }}
                />
              )}

              {currentElement.type === "graphic" && (
                <GraphicPropertiesPanel
                  element={currentElement}
                  onUpdate={(updates) => {
                    setElements((prev) =>
                      prev.map((e) =>
                        e.id === currentElement.id ? { ...e, ...updates } : e,
                      ),
                    );
                  }}
                />
              )}

              {currentElement.type === "qr" && (
                <QRPropertiesPanel
                  element={currentElement}
                  onUpdate={(updates) => {
                    setElements((prev) =>
                      prev.map((e) =>
                        e.id === currentElement.id ? { ...e, ...updates } : e,
                      ),
                    );
                  }}
                  updateQRCode={updateQRCode}
                />
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <button
                  onClick={duplicateElement}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => deleteElement(selectedId)}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Property Panels
const TextPropertiesPanel = ({ element, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Content
        </label>
        <textarea
          value={element.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Letter Spacing
        </label>
        <input
          type="number"
          value={element.letterSpacing || 0}
          onChange={(e) =>
            onUpdate({ letterSpacing: parseInt(e.target.value) || 0 })
          }
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            placeholder="X"
            className="p-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            placeholder="Y"
            className="p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
};

const ImagePropertiesPanel = ({ element, onUpdate }) => {
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        onUpdate({ image: img, imageSrc: e.target.result });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Replace Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

const GraphicPropertiesPanel = ({ element, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fill Color
        </label>
        <input
          type="color"
          value={element.fill}
          onChange={(e) => onUpdate({ fill: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stroke Color
        </label>
        <input
          type="color"
          value={element.stroke}
          onChange={(e) => onUpdate({ stroke: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stroke Width
        </label>
        <input
          type="number"
          value={element.strokeWidth}
          onChange={(e) =>
            onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })
          }
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

const QRPropertiesPanel = ({ element, onUpdate, updateQRCode }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          QR Data (URL or Text)
        </label>
        <textarea
          value={element.qrData}
          onChange={(e) => {
            onUpdate({ qrData: e.target.value });
            updateQRCode(element.id, e.target.value);
          }}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          rows={3}
          placeholder="Enter URL or text"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 200;
              onUpdate({ width: size, height: size });
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 200;
              onUpdate({ width: size, height: size });
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;
