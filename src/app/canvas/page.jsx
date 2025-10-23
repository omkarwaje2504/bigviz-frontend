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
import QRCode from "qrcode";
import { graphicsLibrary } from "./graphicsLibrary";
import "./App.css";
import UploadFile, { createS3Url } from "@services/uploadFile";
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaArrowAltCircleDown,
  FaArrowAltCircleUp,
} from "react-icons/fa";
import {
  MdOutlineVerticalAlignBottom,
  MdOutlineVerticalAlignCenter,
  MdOutlineVerticalAlignTop,
} from "react-icons/md";
import GenerateImage from "@services/GenerateImage";

const DesignStudio = () => {
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
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [showCanvasSizeModal, setShowCanvasSizeModal] = useState(false);
  const [graphicsCategory, setGraphicsCategory] = useState("icons");
  const [showAddonsPanel, setShowAddonsPanel] = useState(false);
  const [renamingLayerId, setRenamingLayerId] = useState(null);
  const renameInputRef = useRef(null);
  // Group editing state
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);

  // Calendar state
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarStartWeek, setCalendarStartWeek] = useState("monday");

  const [calendarEditTab, setCalendarEditTab] = useState("group"); // "group" or "individual"
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [weekendHighlight, setWeekendHighlight] = useState({
    enabled: false,
    highlightDays: "both", // "saturday", "sunday", "both"
    color: "#ff6b6b",
  });

  // Konva stage settings
  const [stageSize, setStageSize] = useState({ width: 1050, height: 600 });
  const [tempStageSize, setTempStageSize] = useState({
    width: 1050,
    height: 600,
  });
  const [stageScale, setStageScale] = useState(1);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const MAX_HISTORY = 50;

  // Refs
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);

  // Load templates from localStorage
  useEffect(() => {
    const loadTemplatesFromS3 = async () => {
      try {
        const indexUrl = createS3Url({ name: "config/templates-index.json" });
        const response = await fetch(indexUrl);

        if (response.ok) {
          const templatesList = await response.json();
          setTemplates(templatesList);
        }
      } catch (error) {
        console.error("Failed to load templates from S3:", error);
        // Fallback to localStorage if S3 fails
        const savedTemplates = localStorage.getItem("design-templates");
        if (savedTemplates) {
          setTemplates(JSON.parse(savedTemplates));
        }
      }
    };

    loadTemplatesFromS3();
  }, []);

  const addToHistory = useCallback(
    (newElements) => {
      setHistory((prev) => {
        // Remove any future history if we're not at the end
        const newHistory = prev.slice(0, historyStep + 1);

        // Add new state
        newHistory.push(JSON.parse(JSON.stringify(newElements))); // Deep clone

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
          setHistoryStep((step) => Math.max(0, step - 1));
          return newHistory;
        }

        setHistoryStep(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyStep],
  );

  const loadTemplateFromS3 = async (templateId) => {
    try {
      const templateUrl = createS3Url({ name: `config/${templateId}.json` });
      const response = await fetch(templateUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }

      const template = await response.json();

      // Load images for elements
      const loadedElements = await Promise.all(
        template.elements.map(async (el) => {
          if ((el.type === "image" || el.type === "graphic") && el.imageSrc) {
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

      setCurrentTemplateName(template.name);
      setCurrentTemplateId(template.id);
      setStageSize(template.stageSize);
      setElements(loadedElements);
      setSelectedId(null);
    } catch (error) {
      console.error("Error loading template from S3:", error);
      alert("Failed to load template from S3");
    }
  };

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

  const currentElement = elements.find((el) => el.id === selectedId);

  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const node = stageRef.current?.findOne(`#${selectedId}`);
      if (node && node !== transformerRef.current.nodes()[0]) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      } else if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }

      // Disable resizing if element is locked
      if (currentElement && currentElement.locked) {
        transformerRef.current.enabledAnchors([]);
        transformerRef.current.rotateEnabled(false);
      } else {
        // Enable all anchors for unlocked elements
        transformerRef.current.enabledAnchors([
          "top-left",
          "top-center",
          "top-right",
          "middle-right",
          "middle-left",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ]);
        transformerRef.current.rotateEnabled(true);
      }
    }
  }, [selectedId, currentElement?.locked]);

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
      if (event.key === "F2" && selectedId) {
        event.preventDefault();
        setRenamingLayerId(selectedId);
      }
      if ((event.ctrlKey || event.metaKey) && selectedId) {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveLayerUp(selectedId);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          moveLayerDown(selectedId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  useEffect(() => {
    if (renamingLayerId && renameInputRef.current) {
      try {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      } catch (e) {}
    }
  }, [renamingLayerId]);

  useEffect(() => {
    setElements((prev) => {
      const normalized = [...prev]
        .sort((a, b) => (a.layer || 0) - (b.layer || 0))
        .map((el, i) => ({ ...el, layer: i + 1 }));
      return normalized;
    });
  }, []);

  useEffect(() => {
    // Debounce to avoid adding to history on every tiny change
    const timeoutId = setTimeout(() => {
      const currentState = JSON.stringify(elements);
      const lastHistoryState = JSON.stringify(history[historyStep] || []);

      // Only add if state actually changed
      if (currentState !== lastHistoryState) {
        addToHistory(elements);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [elements]); // Don't include addToHistory or it will cause infinite loop

  /**
   * Convert layer name to valid variable name
   * Converts "User Photo" to "USER_PHOTO"
   */
  const toVariableName = (name) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores
  };

  /**
   * Export DesignStudio configuration to GenerateImage format with layer name variables
   * Uses actual layer names as variable placeholders
   */
  const exportToGenerateImageTemplate = () => {
    const config = {
      width: stageSize.width,
      height: stageSize.height,
      backgroundImage: undefined,
      overlayImages: [],
      textBlocks: [],
      mimeType: "image/png",
      quality: 1,
      pixelRatio: 2,
    };

    // Sort elements by layer for proper ordering
    const sortedElements = [...elements].sort(
      (a, b) => (a.layer || 0) - (b.layer || 0),
    );

    // Find background image using isBackground flag
    const bgImage = sortedElements.find(
      (el) =>
        (el.type === "image" || el.type === "graphic") &&
        el.isBackground === true,
    );

    if (bgImage) {
      const varName = toVariableName(bgImage.name);
      config.backgroundImage = {
        src: `{{${varName}}}`, // Variable based on layer name
        width: bgImage.width,
        height: bgImage.height,
      };
    }

    // Process all elements
    sortedElements.forEach((element) => {
      if (!element.visible) return; // Skip invisible elements

      const varName = toVariableName(element.name);

      // Process images and graphics as overlayImages
      if (
        element.type === "image" ||
        element.type === "graphic" ||
        element.type === "qr"
      ) {
        // Skip if marked as background image
        if (element.isBackground === true) return;

        config.overlayImages.push({
          src: `{{${varName}}}`, // Variable based on layer name
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.layer || 0,
          behindBackground: bgImage ? element.layer < bgImage.layer : false,
          cornerRadius: element.cornerRadius || 0,
          offsetX: element.width / 2,
          offsetY: element.height / 2,
          skewX: 0,
          skewY: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: element.rotation || 0,
        });
      }

      // Process text elements as textBlocks
      if (element.type === "text") {
        config.textBlocks.push({
          text: `{{${varName}}}`, // Variable based on layer name
          x: element.x,
          y: element.y,
          width: element.width || stageSize.width - element.x,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily || "Arial",
          fill: element.fill || "#000000",
          align: element.align || "left",
          lineHeight: 1.2,
          maxChars: undefined,
          verticalAlign: element.verticalAlign || "top",
          backgroundColor: undefined,
          padding: 0,
          zIndex: element.layer || 0,
        });
      }

      // Process calendar groups as multiple textBlocks
      if (element.type === "calendarGroup" && element.children) {
        element.children.forEach((child, index) => {
          if (child.type === "calendar-text") {
            const childVarName = toVariableName(
              child.name || `${element.name}_${index + 1}`,
            );

            config.textBlocks.push({
              text: `{{${childVarName}}}`, // Variable based on child name
              x: element.x + child.x,
              y: element.y + child.y,
              width: child.width || 100,
              fontSize: child.fontSize,
              fontFamily: child.fontFamily || "Arial",
              fill: child.fill || "#000000",
              align: child.align || "center",
              lineHeight: 1.2,
              verticalAlign: "top",
              zIndex: element.layer || 0,
            });
          }
        });
      }
    });

    return config;
  };

  /**
   * Generate variable mapping guide based on layer names
   * This creates a reference showing what data needs to be provided
   */
  const generateVariableGuide = () => {
    const guide = {
      instructions:
        "Replace these variables with actual data before using GenerateImage",
      variables: {},
      layerMapping: [],
    };

    // Sort elements by layer for proper ordering
    const sortedElements = [...elements].sort(
      (a, b) => (a.layer || 0) - (b.layer || 0),
    );

    sortedElements.forEach((element) => {
      if (!element.visible) return;

      const varName = toVariableName(element.name);
      const layerInfo = {
        layerName: element.name,
        variableName: varName,
        type: element.type,
        layer: element.layer || 0,
        isBackground: element.isBackground || false,
      };

      if (
        element.type === "image" ||
        element.type === "graphic" ||
        element.type === "qr"
      ) {
        guide.variables[varName] = {
          description: `URL or blob URL for layer "${element.name}"${element.isBackground ? " (Background Image)" : ""}`,
          type: "image",
          isBackground: element.isBackground || false,
          example: "https://example.com/image.jpg or blob:http://...",
        };
        layerInfo.dataType = element.isBackground
          ? "Background Image URL (string)"
          : "Image URL (string)";
      }

      if (element.type === "text") {
        guide.variables[varName] = {
          description: `Text content for layer "${element.name}"`,
          type: "text",
          example: "Your text here",
        };
        layerInfo.dataType = "Text (string)";
      }

      if (element.type === "calendarGroup" && element.children) {
        element.children.forEach((child, index) => {
          const childVarName = toVariableName(
            child.name || `${element.name}_${index + 1}`,
          );
          guide.variables[childVarName] = {
            description: `Calendar text for "${child.name || element.name}"`,
            type: "text",
            example: child.text || "Calendar text",
          };

          guide.layerMapping.push({
            layerName: child.name || `${element.name} child ${index + 1}`,
            variableName: childVarName,
            type: "calendar-text",
            layer: element.layer || 0,
            dataType: "Text (string)",
            isBackground: false,
          });
        });
      }

      if (element.type !== "calendarGroup") {
        guide.layerMapping.push(layerInfo);
      }
    });

    return guide;
  };

  /**
   * Get template configuration as JSON with layer name variables
   */
  const getTemplateConfigJSON = () => {
    const template = exportToGenerateImageTemplate();
    return JSON.stringify(template, null, 2);
  };

  const useTemplateExample = async (dataMapping) => {
    // Get the template
    let configString = JSON.stringify(exportToGenerateImageTemplate());

    // Replace all variables with actual data
    Object.keys(dataMapping).forEach((variable) => {
      const placeholder = `{{${variable}}}`;
      configString = configString.replaceAll(
        placeholder,
        JSON.stringify(dataMapping[variable]),
      );
    });

    // Parse back to object
    const config = JSON.parse(configString);

    const result = await GenerateImage(config);

    return result;
  };

  /**
   * Save template as JSON file with layer name mappings
   */
  const downloadTemplateAsJSON = () => {
    const template = exportToGenerateImageTemplate();
    const guide = generateVariableGuide();

    const output = {
      template,
      variableGuide: guide,
      metadata: {
        templateName: currentTemplateName,
        createdAt: new Date().toISOString(),
        canvasSize: {
          width: stageSize.width,
          height: stageSize.height,
        },
        totalLayers: elements.length,
        visibleLayers: elements.filter((el) => el.visible).length,
      },
    };

    const jsonString = JSON.stringify(output, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `${currentTemplateName.replace(/\s+/g, "-")}-template.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Template with layer name mappings downloaded!");
  };

  /**
   * Generate TypeScript interface for the data mapping
   */
  const generateTypeScriptInterface = () => {
    const guide = generateVariableGuide();
    let tsInterface = "interface TemplateData {\n";

    Object.keys(guide.variables).forEach((varName) => {
      const varInfo = guide.variables[varName];
      tsInterface += `  ${varName}: string; // ${varInfo.description}\n`;
    });

    tsInterface += "}";

    console.log(tsInterface);
    return tsInterface;
  };

  const getNextLayer = useCallback(() => {
    if (elements.length === 0) return 1;
    return Math.max(...elements.map((e) => e.layer || 0)) + 1;
  }, [elements]);

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new window.Image();
          img.onload = () => {
            const stage = stageRef.current;
            const pointerPosition = stage.getPointerPosition();

            const element = {
              id: `image-${elementCounter}`,
              type: "image",
              name: `Image ${elementCounter}`,
              x: pointerPosition
                ? pointerPosition.x - img.width / 4
                : stageSize.width / 2 - img.width / 4,
              y: pointerPosition
                ? pointerPosition.y - img.height / 4
                : stageSize.height / 2 - img.height / 4,
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
              isBackground: false,
            };
            setElements((prev) => [...prev, element]);
            setSelectedId(element.id);
            setElementCounter((prev) => prev + 1);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const calculateTextHeight = (text, fontSize, width) => {
    // Estimate number of lines based on text length and width
    const lines = text.split("\n").length;
    const lineHeight = fontSize * 1.5; // Standard line height multiplier

    // If width is set, estimate wrapping
    if (width) {
      const avgCharWidth = fontSize * 0.6;
      const charsPerLine = Math.floor(width / avgCharWidth);
      const totalChars = text.replace(/\n/g, "").length;
      const wrappedLines = Math.ceil(totalChars / charsPerLine);
      const totalLines = Math.max(lines, wrappedLines);
      return totalLines * lineHeight;
    }

    return lines * lineHeight;
  };

  // Add text element
  const addTextElement = () => {
    const defaultText = "Type text here";
    const defaultFontSize = 48;
    const defaultHeight = calculateTextHeight(
      defaultText,
      defaultFontSize,
      null,
    );

    const element = {
      id: `text-${elementCounter}`,
      type: "text",
      name: `Text ${elementCounter}`,
      text: defaultText,
      x: stageSize.width / 2 - 100,
      y: stageSize.height / 2 - 25,
      fontSize: defaultFontSize,
      fontFamily: "Arial",
      fill: "#000000",
      fontStyle: "normal",
      align: "left",
      verticalAlign: "top",
      letterSpacing: 0,
      rotation: 0,
      width: null,
      height: defaultHeight,
      opacity: 1,
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
      setShowAddonsPanel(false);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code");
    }
  };

  // Generate Calendar as Group
  const generateCalendar = () => {
    const year = calendarYear;
    const month = calendarMonth - 1;
    const startWeek = calendarStartWeek;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let firstDayOfWeek = firstDay.getDay();

    if (startWeek === "monday") {
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    }

    const cellWidth = 120;
    const cellHeight = 100;
    const headerHeight = 50;
    const padding = 20;
    const calendarWidth = cellWidth * 7 + padding * 2;
    const totalRows = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
    const calendarHeight = headerHeight + cellHeight * totalRows + padding * 2;

    const startX = (stageSize.width - calendarWidth) / 2;
    const startY = (stageSize.height - calendarHeight) / 2;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayNames =
      startWeek === "monday"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Create group children
    const groupChildren = [];
    const groupId = `calendar-group-${elementCounter}`;

    // Add title
    groupChildren.push({
      id: `${groupId}-title`,
      type: "calendar-text",
      role: "title",
      text: `${monthNames[month]} ${year}`,
      x: padding,
      y: padding,
      fontSize: 32,
      fontFamily: "Arial",
      fill: "#000000",
      fontStyle: "bold",
      align: "center",
      width: calendarWidth - padding * 2,
    });

    // Add day headers
    dayNames.forEach((day, index) => {
      groupChildren.push({
        id: `${groupId}-day-${index}`,
        type: "calendar-text",
        role: "dayHeader",
        text: day,
        x: padding + index * cellWidth,
        y: padding + headerHeight,
        fontSize: 18,
        fontFamily: "Arial",
        fill: "#666666",
        fontStyle: "bold",
        align: "center",
        width: cellWidth,
      });
    });

    // Add date numbers
    let dayCounter = 1;
    for (let week = 0; week < totalRows; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        if (
          (week === 0 && dayOfWeek < firstDayOfWeek) ||
          dayCounter > daysInMonth
        ) {
          continue;
        }

        groupChildren.push({
          id: `${groupId}-date-${dayCounter}`,
          type: "calendar-text",
          role: "date",
          text: dayCounter.toString(),
          x: padding + dayOfWeek * cellWidth,
          y: padding + headerHeight + 30 + week * cellHeight,
          fontSize: 28,
          fontFamily: "Arial",
          fill: "#000000",
          originalFill: "#000000", // Store original color
          fontStyle: "normal",
          align: "center",
          width: cellWidth,
          dayOfWeek: dayOfWeek, // Store day of week (0=Sunday, 6=Saturday)
          letterSpacing: 0,
        });
        dayCounter++;
      }
    }

    // Create the calendar group element
    const calendarGroup = {
      id: groupId,
      type: "calendarGroup",
      name: `Calendar ${monthNames[month]} ${year}`,
      x: startX,
      y: startY,
      width: calendarWidth,
      height: calendarHeight,
      rotation: 0,
      opacity: 1,
      fontSize: 28, // Default font size for dates
      fontFamily: "Arial",
      fill: "#000000",
      fontStyle: "normal",
      layer: getNextLayer(),
      visible: true,
      locked: false,
      draggable: true,
      isGrouped: true,
      children: groupChildren,
    };

    setElements((prev) => [...prev, calendarGroup]);
    setSelectedId(groupId);
    setElementCounter((prev) => prev + 1);
    setShowAddonsPanel(false);
  };

  // Ungroup calendar (for editing)
  const ungroupCalendar = (groupId) => {
    const group = elements.find((el) => el.id === groupId);
    if (!group || group.type !== "calendarGroup") return;

    setEditingGroupId(groupId);
    setShowGroupEditModal(true);
  };

  // Regroup calendar (after editing)
  const regroupCalendar = () => {
    setEditingGroupId(null);
    setShowGroupEditModal(false);
  };

  // Update the updateGroupProperty function to handle role-based updates
  const updateGroupPropertyByRole = (groupId, role, property, value) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === groupId && el.type === "calendarGroup") {
          const updatedChildren = el.children.map((child) => {
            if (child.role === role) {
              return { ...child, [property]: value };
            }
            return child;
          });
          return { ...el, children: updatedChildren };
        }
        return el;
      }),
    );
  };

  // Function to apply weekend highlighting
  const applyWeekendHighlight = (groupId, config) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === groupId && el.type === "calendarGroup") {
          const updatedChildren = el.children.map((child) => {
            if (child.role === "date" && child.dayOfWeek !== undefined) {
              // Check if it's a weekend day
              const isSaturday = child.dayOfWeek === 6;
              const isSunday = child.dayOfWeek === 0;

              let shouldHighlight = false;
              if (config.enabled) {
                if (
                  config.highlightDays === "both" &&
                  (isSaturday || isSunday)
                ) {
                  shouldHighlight = true;
                } else if (config.highlightDays === "saturday" && isSaturday) {
                  shouldHighlight = true;
                } else if (config.highlightDays === "sunday" && isSunday) {
                  shouldHighlight = true;
                }
              }

              return {
                ...child,
                fill: shouldHighlight
                  ? config.color
                  : child.originalFill || "#000000",
                isWeekendHighlighted: shouldHighlight,
              };
            }
            return child;
          });
          return { ...el, children: updatedChildren, weekendHighlight: config };
        }
        return el;
      }),
    );
  };

  // Update group property (applies to all children)
  const updateGroupProperty = (groupId, property, value) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === groupId && el.type === "calendarGroup") {
          const updatedChildren = el.children.map((child) => {
            // Update the property for all children
            if (
              property === "fontFamily" ||
              property === "fontSize" ||
              property === "fill" ||
              property === "fontStyle"
            ) {
              return { ...child, [property]: value };
            }
            return child;
          });
          return { ...el, [property]: value, children: updatedChildren };
        }
        return el;
      }),
    );
  };

  // Update individual child in group
  const updateGroupChild = (groupId, childId, updates) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === groupId && el.type === "calendarGroup") {
          const updatedChildren = el.children.map((child) =>
            child.id === childId ? { ...child, ...updates } : child,
          );
          return { ...el, children: updatedChildren };
        }
        return el;
      }),
    );
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
    if (!id) return;
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const duplicateElement = () => {
    if (!currentElement) return;

    const copy = {
      ...currentElement,
      id: `${currentElement.type}-${elementCounter}`,
      x: currentElement.x + 20,
      y: currentElement.y + 20,
      name: `${currentElement.name} Copy`,
      layer: getNextLayer(),
    };

    // If it's a calendar group, duplicate children with new IDs
    if (copy.type === "calendarGroup" && copy.children) {
      copy.children = copy.children.map((child, index) => ({
        ...child,
        id: `${copy.id}-child-${index}`,
      }));
    }

    setElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setElementCounter((prev) => prev + 1);
  };

  // Layer management
  // Move layer up
  // Move layer up
  const moveLayerUp = (id) => {
    setElements((prev) => {
      const target = prev.find((el) => el.id === id);
      if (!target) return prev;

      // Sort by layer order
      const sorted = [...prev].sort((a, b) => (a.layer || 0) - (b.layer || 0));
      const index = sorted.findIndex((el) => el.id === id);

      if (index === sorted.length - 1) return prev; // already top

      // Get the element above
      const above = sorted[index + 1];

      // Swap layer values in the original array
      return prev.map((el) => {
        if (el.id === id) {
          return { ...el, layer: above.layer };
        } else if (el.id === above.id) {
          return { ...el, layer: target.layer };
        }
        return el;
      });
    });
  };

  // Move layer down
  const moveLayerDown = (id) => {
    setElements((prev) => {
      const target = prev.find((el) => el.id === id);
      if (!target) return prev;

      // Sort by layer order
      const sorted = [...prev].sort((a, b) => (a.layer || 0) - (b.layer || 0));
      const index = sorted.findIndex((el) => el.id === id);

      if (index === 0) return prev; // already bottom

      // Get the element below
      const below = sorted[index - 1];

      // Swap layer values in the original array
      return prev.map((el) => {
        if (el.id === id) {
          return { ...el, layer: below.layer };
        } else if (el.id === below.id) {
          return { ...el, layer: target.layer };
        }
        return el;
      });
    });
  };

  const commitRename = (id, value) => {
    if (!id) return;
    const newName = (value || "").trim();
    if (newName === "") {
      setRenamingLayerId(null);
      return;
    }
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, name: newName } : el)),
    );
    setRenamingLayerId(null);
  };

  // Template management
  const saveTemplate = (saveAsNew = false) => {
    // const templateName = prompt(
    //   saveAsNew ? "Enter new template name:" : "Save template as:",
    //   currentTemplateName,
    // );
    // if (!templateName) return;

    // const template = {
    //   id: saveAsNew
    //     ? `template-${Date.now()}`
    //     : currentTemplateId || `template-${Date.now()}`,
    //   name: templateName,
    //   timestamp: new Date().toISOString(),
    //   stageSize,
    //   elements: elements.map((el) => {
    //     if (el.type === "image" || el.type === "graphic" || el.type === "qr") {
    //       return { ...el, image: null };
    //     }
    //     return el;
    //   }),
    // };

    // const updatedTemplates = saveAsNew
    //   ? [...templates, template]
    //   : templates.map((t) => (t.id === template.id ? template : t));

    // if (!templates.find((t) => t.id === template.id) && !saveAsNew) {
    //   updatedTemplates.push(template);
    // }

    // setTemplates(updatedTemplates);
    // localStorage.setItem("design-templates", JSON.stringify(updatedTemplates));

    // setCurrentTemplateName(templateName);
    // setCurrentTemplateId(template.id);
    saveTemplateToS3(saveAsNew);
    alert(`Template saved successfully!`);
  };

  const saveTemplateToS3 = async (saveAsNew = false) => {
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
        if (el.type === "image" || el.type === "graphic" || el.type === "qr") {
          return { ...el, image: null };
        }
        return el;
      }),
    };

    // Convert template to JSON blob
    const jsonBlob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });

    // Upload to S3 using existing utility
    try {
      const fileName = `${template.id}.json`;
      const fileUrl = await UploadFile(
        "canvas", // Pass appropriate hash
        null, // Pass project info
        jsonBlob,
        fileName,
        "config",
      );

      // Update local state
      setCurrentTemplateName(templateName);
      setCurrentTemplateId(template.id);

      // Also save to config index file
      await updateConfigIndex(template);

      alert(`Template "${templateName}" saved to S3 successfully!`);
    } catch (error) {
      console.error("Failed to save template to S3:", error);
      alert("Failed to save template. Please try again.");
    }
  };

  // Store a master index of all templates in S3
  const updateConfigIndex = async (newTemplate) => {
    try {
      // Fetch existing index
      const indexUrl = createS3Url({ name: "config/templates-index.json" });
      let templates = [];

      try {
        const response = await fetch(indexUrl);
        if (response.ok) {
          templates = await response.json();
        }
      } catch (e) {
        // Index doesn't exist yet, start fresh
        templates = [];
      }

      // Update or add template
      const existingIndex = templates.findIndex((t) => t.id === newTemplate.id);
      if (existingIndex >= 0) {
        templates[existingIndex] = {
          id: newTemplate.id,
          name: newTemplate.name,
          timestamp: newTemplate.timestamp,
        };
      } else {
        templates.push({
          id: newTemplate.id,
          name: newTemplate.name,
          timestamp: newTemplate.timestamp,
        });
      }

      // Upload updated index
      const indexBlob = new Blob([JSON.stringify(templates, null, 2)], {
        type: "application/json",
      });

      await UploadFile(
        "canvas",
        null,
        indexBlob,
        "templates-index.json",
        "config",
      );
    } catch (error) {
      console.error("Failed to update config index:", error);
    }
  };

  const loadTemplate = async (template) => {
    setCurrentTemplateName(template.name);
    setCurrentTemplateId(template.id);
    setStageSize(template.stageSize);

    const loadedElements = await Promise.all(
      template.elements.map(async (el) => {
        if ((el.type === "image" || el.type === "graphic") && el.imageSrc) {
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
        if (el.type === "image" || el.type === "graphic" || el.type === "qr") {
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
    const uri = stageRef.current.toDataURL({ pixelRatio: 1 });
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
    if (clickedElement) {
      setSelectedId(e.target.id());
    }
  };

  const handleElementDoubleClick = (e, element) => {
    if (element.type === "calendarGroup") {
      e.cancelBubble = true;
      ungroupCalendar(element.id);
    }
  };

  // Render calendar group
  const renderCalendarGroup = (element, commonProps) => {
    if (!element.children) return null;

    return (
      <Group
        {...commonProps}
        onDblClick={(e) => handleElementDoubleClick(e, element)}
        onDblTap={(e) => handleElementDoubleClick(e, element)}
      >
        {element.children.map((child) => (
          <Text
            key={child.id}
            text={child.text}
            x={child.x}
            y={child.y}
            fontSize={child.fontSize}
            fontFamily={child.fontFamily}
            fill={child.fill}
            fontStyle={child.fontStyle}
            align={child.align}
            width={child.width}
          />
        ))}
      </Group>
    );
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
        draggable: !element.locked, // Prevent dragging when locked
        onDragEnd: (e) => {
          const updatedElements = elements.map((el) =>
            el.id === element.id
              ? { ...el, x: e.target.x(), y: e.target.y() }
              : el,
          );
          setElements(updatedElements);
        },
      };

      // Render calendar group
      if (element.type === "calendarGroup") {
        return renderCalendarGroup(element, commonProps);
      }

      switch (element.type) {
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
              verticalAlign={element.verticalAlign || "top"}
              letterSpacing={element.letterSpacing || 0}
              width={element.width}
              opacity={element.opacity}
              height={element.height || 100}
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
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="px-3 py-2 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-md">CloudBoard</span>
            </div>
          </div>
          <input
            type="text"
            value={currentTemplateName}
            onChange={(e) => setCurrentTemplateName(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-transparent text-gray-700 focus:outline font-medium"
            style={{ minWidth: "200px" }}
          />
          <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
            <div className="text-xs font-medium text-gray-600">
              Canvas: {stageSize.width} × {stageSize.height} px
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => saveTemplate(false)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>{" "}
            Saving...
          </button>

          {/* In the top header, add these buttons */}
          {/* In the top header, replace with these buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplateAsJSON}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2"
            >
              📥 Download Template
            </button>
          </div>

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

      {/* Properties Ribbon */}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6">
          <button
            onClick={() => setShowCanvasSizeModal(true)}
            className="flex flex-col items-center gap-1 p-2 rounded transition-colors text-gray-600 hover:text-gray-900"
            title="Canvas Size"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
            <span className="text-xs font-medium">Canvas</span>
          </button>

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
            onClick={() => {
              setShowAddonsPanel(!showAddonsPanel);
              setActiveTab("addons");
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              activeTab === "addons"
                ? "text-blue-500"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Add-ons"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="text-xs">Add-ons</span>
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

        {/* Canvas Size Modal */}
        {showCanvasSizeModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Canvas Size</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={tempStageSize.width}
                    onChange={(e) =>
                      setTempStageSize({
                        ...tempStageSize,
                        width: parseInt(e.target.value) || 1050,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={tempStageSize.height}
                    onChange={(e) =>
                      setTempStageSize({
                        ...tempStageSize,
                        height: parseInt(e.target.value) || 600,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setStageSize(tempStageSize);
                      setShowCanvasSizeModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setTempStageSize(stageSize);
                      setShowCanvasSizeModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Edit Modal */}
        {showGroupEditModal && editingGroupId && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Edit Calendar</h3>
                <button
                  onClick={regroupCalendar}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => setCalendarEditTab("group")}
                  className={`px-6 py-3 font-medium transition-colors ${
                    calendarEditTab === "group"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Group Settings
                </button>
                <button
                  onClick={() => setCalendarEditTab("individual")}
                  className={`px-6 py-3 font-medium transition-colors ${
                    calendarEditTab === "individual"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Individual Elements
                </button>
              </div>

              {/* Group Settings Tab */}
              {calendarEditTab === "group" && (
                <div className="space-y-6">
                  {/* Title Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Title Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Family
                        </label>
                        <select
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "title")
                              ?.fontFamily || "Arial"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "title",
                              "fontFamily",
                              e.target.value,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">
                            Times New Roman
                          </option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "title")
                              ?.fontSize || 32
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "title",
                              "fontSize",
                              parseInt(e.target.value) || 32,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="8"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <input
                          type="color"
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "title")
                              ?.fill || "#000000"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "title",
                              "fill",
                              e.target.value,
                            );
                          }}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Style
                        </label>
                        <select
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "title")
                              ?.fontStyle || "bold"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "title",
                              "fontStyle",
                              e.target.value,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="italic">Italic</option>
                          <option value="bold italic">Bold Italic</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Day Headers Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Day Headers Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Family
                        </label>
                        <select
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "dayHeader")
                              ?.fontFamily || "Arial"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "dayHeader",
                              "fontFamily",
                              e.target.value,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">
                            Times New Roman
                          </option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "dayHeader")
                              ?.fontSize || 18
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "dayHeader",
                              "fontSize",
                              parseInt(e.target.value) || 18,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="8"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <input
                          type="color"
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "dayHeader")
                              ?.fill || "#666666"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "dayHeader",
                              "fill",
                              e.target.value,
                            );
                          }}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Style
                        </label>
                        <select
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "dayHeader")
                              ?.fontStyle || "bold"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "dayHeader",
                              "fontStyle",
                              e.target.value,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="italic">Italic</option>
                          <option value="bold italic">Bold Italic</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date Numbers Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Date Numbers Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Family
                        </label>
                        <select
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "date")
                              ?.fontFamily || "Arial"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "date",
                              "fontFamily",
                              e.target.value,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">
                            Times New Roman
                          </option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "date")
                              ?.fontSize || 28
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "date",
                              "fontSize",
                              parseInt(e.target.value) || 28,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="8"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <input
                          type="color"
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "date")?.fill ||
                            "#000000"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "date",
                              "fill",
                              e.target.value,
                            );
                          }}
                          className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Style
                        </label>
                        <select
                          value={
                            elements
                              .find((el) => el.id === editingGroupId)
                              ?.children.find((c) => c.role === "date")
                              ?.fontStyle || "normal"
                          }
                          onChange={(e) => {
                            updateGroupPropertyByRole(
                              editingGroupId,
                              "date",
                              "fontStyle",
                              e.target.value,
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="italic">Italic</option>
                          <option value="bold italic">Bold Italic</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Weekend Highlighting */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Weekend Highlighting
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="weekend-enable"
                          checked={weekendHighlight.enabled}
                          onChange={(e) => {
                            const newConfig = {
                              ...weekendHighlight,
                              enabled: e.target.checked,
                            };
                            setWeekendHighlight(newConfig);
                            applyWeekendHighlight(editingGroupId, newConfig);
                          }}
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor="weekend-enable"
                          className="text-sm font-medium text-gray-700"
                        >
                          Enable weekend highlighting
                        </label>
                      </div>

                      {weekendHighlight.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Highlight Days
                            </label>
                            <select
                              value={weekendHighlight.highlightDays}
                              onChange={(e) => {
                                const newConfig = {
                                  ...weekendHighlight,
                                  highlightDays: e.target.value,
                                };
                                setWeekendHighlight(newConfig);
                                applyWeekendHighlight(
                                  editingGroupId,
                                  newConfig,
                                );
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="both">
                                Both Saturday & Sunday
                              </option>
                              <option value="saturday">Saturday Only</option>
                              <option value="sunday">Sunday Only</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Highlight Color
                            </label>
                            <input
                              type="color"
                              value={weekendHighlight.color}
                              onChange={(e) => {
                                const newConfig = {
                                  ...weekendHighlight,
                                  color: e.target.value,
                                };
                                setWeekendHighlight(newConfig);
                                applyWeekendHighlight(
                                  editingGroupId,
                                  newConfig,
                                );
                              }}
                              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Elements Tab */}
              {calendarEditTab === "individual" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Click on an element to customize it individually
                  </p>

                  {/* Elements List */}
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                    {elements
                      .find((el) => el.id === editingGroupId)
                      ?.children?.map((child) => (
                        <div
                          key={child.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedChildId === child.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedChildId(child.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {child.role === "title"
                                ? "📅 Title"
                                : child.role === "dayHeader"
                                  ? `📌 Day: ${child.text}`
                                  : `📆 Date: ${child.text}`}
                            </span>
                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                              {child.fontFamily} {child.fontSize}px
                            </span>
                          </div>

                          {/* Show editing controls when selected */}
                          {selectedChildId === child.id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Text Content
                                </label>
                                <input
                                  type="text"
                                  value={child.text}
                                  onChange={(e) => {
                                    updateGroupChild(editingGroupId, child.id, {
                                      text: e.target.value,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Font Family
                                  </label>
                                  <select
                                    value={child.fontFamily}
                                    onChange={(e) => {
                                      updateGroupChild(
                                        editingGroupId,
                                        child.id,
                                        { fontFamily: e.target.value },
                                      );
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                  >
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">
                                      Times New Roman
                                    </option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Courier New">
                                      Courier New
                                    </option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Comic Sans MS">
                                      Comic Sans MS
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Font Size
                                  </label>
                                  <input
                                    type="number"
                                    value={child.fontSize}
                                    onChange={(e) => {
                                      updateGroupChild(
                                        editingGroupId,
                                        child.id,
                                        {
                                          fontSize:
                                            parseInt(e.target.value) || 12,
                                        },
                                      );
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                    min="8"
                                    max="100"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Color
                                  </label>
                                  <input
                                    type="color"
                                    value={child.fill}
                                    onChange={(e) => {
                                      updateGroupChild(
                                        editingGroupId,
                                        child.id,
                                        {
                                          fill: e.target.value,
                                          originalFill: e.target.value,
                                        },
                                      );
                                    }}
                                    className="w-full h-8 border border-gray-300 rounded-lg cursor-pointer"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Font Style
                                  </label>
                                  <select
                                    value={child.fontStyle}
                                    onChange={(e) => {
                                      updateGroupChild(
                                        editingGroupId,
                                        child.id,
                                        { fontStyle: e.target.value },
                                      );
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                    <option value="italic">Italic</option>
                                    <option value="bold italic">
                                      Bold Italic
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Alignment
                                  </label>
                                  <select
                                    value={child.align}
                                    onChange={(e) => {
                                      updateGroupChild(
                                        editingGroupId,
                                        child.id,
                                        { align: e.target.value },
                                      );
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                  >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Letter Spacing
                                  </label>
                                  <input
                                    type="number"
                                    value={child.letterSpacing || 0}
                                    onChange={(e) => {
                                      updateGroupChild(
                                        editingGroupId,
                                        child.id,
                                        {
                                          letterSpacing:
                                            parseInt(e.target.value) || 0,
                                        },
                                      );
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                    min="-10"
                                    max="50"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedChildId(null)}
                                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    setCalendarEditTab("group");
                    setSelectedChildId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Reset Selection
                </button>
                <button
                  onClick={regroupCalendar}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Done Editing
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Add-ons Panel */}
        {showAddonsPanel && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add-ons</h2>
                <button
                  onClick={() => setShowAddonsPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">QR Code</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Generate a QR code with custom URL or text
                  </p>
                  <button
                    onClick={addQRElement}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Add QR Code
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Calendar</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Generate a calendar for any month
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={calendarYear}
                        onChange={(e) =>
                          setCalendarYear(parseInt(e.target.value) || 2025)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="1900"
                        max="2100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Month
                      </label>
                      <select
                        value={calendarMonth}
                        onChange={(e) =>
                          setCalendarMonth(parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {[
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ].map((month, index) => (
                          <option key={index} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Week Starts On
                      </label>
                      <select
                        value={calendarStartWeek}
                        onChange={(e) => setCalendarStartWeek(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="monday">Monday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>

                    <button
                      onClick={generateCalendar}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Generate Calendar
                    </button>
                  </div>
                </div>
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
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {currentElement && (
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 z-10 shadow-sm w-full absolute top-0 left-0">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Common Properties */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">
                    Position:
                  </label>
                  <input
                    type="number"
                    value={Math.round(currentElement.x)}
                    onChange={(e) => {
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === currentElement.id
                            ? { ...el, x: parseInt(e.target.value) || 0 }
                            : el,
                        ),
                      );
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={Math.round(currentElement.y)}
                    onChange={(e) => {
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === currentElement.id
                            ? { ...el, y: parseInt(e.target.value) || 0 }
                            : el,
                        ),
                      );
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="Y"
                  />
                </div>

                {/* Calendar Group Properties */}
                {currentElement.type === "calendarGroup" && (
                  <>
                    <div className="flex items-center gap-2 border-l pl-4">
                      <select
                        value={currentElement.fontFamily}
                        onChange={(e) => {
                          updateGroupProperty(
                            currentElement.id,
                            "fontFamily",
                            e.target.value,
                          );
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const newSize = Math.max(
                            8,
                            currentElement.fontSize - 2,
                          );
                          const lines = (currentElement.text || "").split(
                            "\n",
                          ).length;
                          const newHeight = Math.max(
                            newSize * 1.5 * lines,
                            newSize * 1.5,
                          );

                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? {
                                    ...el,
                                    fontSize: newSize,
                                    height: newHeight,
                                  }
                                : el,
                            ),
                          );
                        }}
                        className="px-2 py-1 hover:bg-gray-200 rounded text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentElement.fontSize}
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value) || 48;
                          const lines = (currentElement.text || "").split(
                            "\n",
                          ).length;
                          const newHeight = Math.max(
                            newSize * 1.5 * lines,
                            newSize * 1.5,
                          );

                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? {
                                    ...el,
                                    fontSize: newSize,
                                    height: newHeight,
                                  }
                                : el,
                            ),
                          );
                        }}
                        className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      />
                      <button
                        onClick={() => {
                          const newSize = currentElement.fontSize + 2;
                          const lines = (currentElement.text || "").split(
                            "\n",
                          ).length;
                          const newHeight = Math.max(
                            newSize * 1.5 * lines,
                            newSize * 1.5,
                          );

                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? {
                                    ...el,
                                    fontSize: newSize,
                                    height: newHeight,
                                  }
                                : el,
                            ),
                          );
                        }}
                        className="px-2 py-1 hover:bg-gray-200 rounded text-xs"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const newStyle =
                          currentElement.fontStyle === "bold"
                            ? "normal"
                            : "bold";
                        updateGroupProperty(
                          currentElement.id,
                          "fontStyle",
                          newStyle,
                        );
                      }}
                      className={`px-3 py-1 rounded font-bold text-xs ${
                        currentElement.fontStyle === "bold"
                          ? "bg-gray-200"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      B
                    </button>

                    <button
                      onClick={() => ungroupCalendar(currentElement.id)}
                      className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-xs font-medium border-l pl-4 ml-4"
                    >
                      Edit Calendar
                    </button>
                  </>
                )}

                {currentElement.type === "text" && (
                  <>
                    <div className="flex items-center gap-2 border-l pl-4">
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
                        className="px-3 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const newSize = Math.max(
                            8,
                            currentElement.fontSize - 2,
                          );
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? { ...el, fontSize: newSize }
                                : el,
                            ),
                          );
                        }}
                        className="px-2 py-1 hover:bg-gray-200 rounded text-xs"
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
                                ? {
                                    ...el,
                                    fontSize: parseInt(e.target.value) || 48,
                                  }
                                : el,
                            ),
                          );
                        }}
                        className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
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
                        className="px-2 py-1 hover:bg-gray-200 rounded text-xs"
                      >
                        +
                      </button>
                      <div className="w-20 relative">
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
                          className="w-32 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newStyle =
                          currentElement.fontStyle === "bold"
                            ? "normal"
                            : "bold";
                        setElements((prev) =>
                          prev.map((el) =>
                            el.id === currentElement.id
                              ? { ...el, fontStyle: newStyle }
                              : el,
                          ),
                        );
                      }}
                      className={`px-3 py-1 rounded font-bold text-xs ${
                        currentElement.fontStyle === "bold"
                          ? "bg-gray-200"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      B
                    </button>

                    <div className="flex items-center gap-3">
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
                        className={` rounded text-sm ${currentElement.align === "left" ? "text-blue-700" : "text-gray-600"}`}
                      >
                        <FaAlignLeft />
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
                        className={` rounded text-sm ${
                          currentElement.align === "center"
                            ? "text-blue-700"
                            : "text-gray-600"
                        }`}
                      >
                        <FaAlignCenter />
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
                        className={`rounded text-sm ${currentElement.align === "right" ? "text-blue-700" : "text-gray-600"}`}
                      >
                        <FaAlignRight />
                      </button>
                    </div>
                    {/* NEW: Vertical Alignment */}
                    <div className="flex items-center gap-2 border-l pl-4">
                      <MdOutlineVerticalAlignTop
                        onClick={() =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? { ...el, verticalAlign: "top" }
                                : el,
                            ),
                          )
                        }
                        className={`rounded text-lg font-bold ${
                          currentElement.verticalAlign === "top"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                        title="Align Top"
                      />
                      <MdOutlineVerticalAlignCenter
                        onClick={() =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? { ...el, verticalAlign: "middle" }
                                : el,
                            ),
                          )
                        }
                        className={`rounded text-lg font-bold ${
                          currentElement.verticalAlign === "middle"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                        title="Align Middle"
                      />
                      <MdOutlineVerticalAlignBottom
                        onClick={() =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? { ...el, verticalAlign: "bottom" }
                                : el,
                            ),
                          )
                        }
                        className={`rounded text-lg font-bold ${
                          currentElement.verticalAlign === "bottom"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                        title="Align Bottom"
                      />
                    </div>

                    <div className="flex items-center gap-2 border-l pl-4">
                      <label className="text-xs font-medium text-gray-600">
                        Letter Spacing:
                      </label>
                      <input
                        type="number"
                        value={currentElement.letterSpacing || 0}
                        onChange={(e) =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? {
                                    ...el,
                                    letterSpacing:
                                      parseInt(e.target.value) || 0,
                                  }
                                : el,
                            ),
                          )
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 border-l pl-4">
                      <label className="text-xs font-medium text-gray-600">
                        Text:
                      </label>
                      <textarea
                        rows="1"
                        cols="50"
                        value={currentElement.text}
                        onChange={(e) => {
                          // Calculate new height based on text content
                          const lines = e.target.value.split("\n").length;
                          const estimatedHeight = Math.max(
                            currentElement.fontSize * 1.5 * lines,
                            currentElement.fontSize * 1.5,
                          );

                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? {
                                    ...el,
                                    text: e.target.value,
                                    height: estimatedHeight,
                                  }
                                : el,
                            ),
                          );
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-xs"
                        style={{ width: "300px" }}
                      ></textarea>
                    </div>
                  </>
                )}

                {(currentElement.type === "image" ||
                  currentElement.type === "graphic") && (
                  <>
                    <div className="flex items-center gap-2 border-l pl-4">
                      <label className="text-xs font-medium text-gray-600">
                        Opacity: {Math.round(currentElement.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        value={currentElement.opacity}
                        onChange={(e) =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? { ...el, opacity: parseFloat(e.target.value) }
                                : el,
                            ),
                          )
                        }
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-32"
                      />
                    </div>
                  </>
                )}

                {currentElement.type === "graphic" && (
                  <>
                    <div className="flex items-center gap-2 border-l pl-4">
                      <label className="text-xs font-medium text-gray-600">
                        Fill:
                      </label>
                      <div className="w-20">
                        <input
                          type="color"
                          value={currentElement.fill}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === currentElement.id
                                  ? { ...el, fill: e.target.value }
                                  : el,
                              ),
                            )
                          }
                          className="w-8 h-8 border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-600">
                        Stroke:
                      </label>
                      <div className="w-20">
                        <input
                          type="color"
                          value={currentElement.stroke}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === currentElement.id
                                  ? { ...el, stroke: e.target.value }
                                  : el,
                              ),
                            )
                          }
                          className="w-8 h-8 border border-gray-300 rounded"
                        />
                      </div>
                      <input
                        type="number"
                        value={currentElement.strokeWidth}
                        onChange={(e) =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === currentElement.id
                                ? {
                                    ...el,
                                    strokeWidth: parseInt(e.target.value) || 0,
                                  }
                                : el,
                            ),
                          )
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                        placeholder="Width"
                      />
                    </div>
                  </>
                )}

                {currentElement.type === "qr" && (
                  <div className="flex items-center gap-2 border-l pl-4">
                    <label className="text-xs font-medium text-gray-600">
                      QR Data:
                    </label>
                    <input
                      type="text"
                      value={currentElement.qrData}
                      onChange={(e) => {
                        setElements((prev) =>
                          prev.map((el) =>
                            el.id === currentElement.id
                              ? { ...el, qrData: e.target.value }
                              : el,
                          ),
                        );
                        updateQRCode(currentElement.id, e.target.value);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-xs"
                      style={{ width: "300px" }}
                      placeholder="Enter URL or text"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 border-l pl-4 ml-auto">
                  <button
                    onClick={duplicateElement}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs font-medium"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => deleteElement(selectedId)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
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

        {/* Layer Panel */}
        {showLayerPanel && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Layers</h3>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2">
              {[...elements]
                .sort((a, b) => (b.layer || 0) - (a.layer || 0))
                .map((element, index) => (
                  <div
                    key={element.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/html", element.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const draggedId = e.dataTransfer.getData("text/html");
                      const targetId = element.id;

                      if (draggedId === targetId) return;

                      const sortedElements = [...elements].sort(
                        (a, b) => (b.layer || 0) - (a.layer || 0),
                      );
                      const draggedIndex = sortedElements.findIndex(
                        (el) => el.id === draggedId,
                      );
                      const targetIndex = sortedElements.findIndex(
                        (el) => el.id === targetId,
                      );

                      if (draggedIndex === -1 || targetIndex === -1) return;

                      // Reorder layers
                      const newElements = [...elements];
                      const draggedElement = sortedElements[draggedIndex];
                      const targetElement = sortedElements[targetIndex];

                      // Swap layer values
                      newElements.forEach((el) => {
                        if (el.id === draggedElement.id) {
                          el.layer = targetElement.layer;
                        } else if (el.id === targetElement.id) {
                          el.layer = draggedElement.layer;
                        }
                      });

                      setElements(newElements);
                    }}
                    className={`py-1 border rounded-lg cursor-move transition-colors ${
                      selectedId === element.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedId(element.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {renamingLayerId === element.id ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            defaultValue={element.name}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) =>
                              commitRename(element.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                commitRename(element.id, e.target.value);
                              } else if (e.key === "Escape") {
                                setRenamingLayerId(null);
                              }
                            }}
                            className="px-1 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div
                            className="flex-1 text-sm font-medium text-gray-700 cursor-text hover:bg-gray-100 px-2 py-1 rounded"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setRenamingLayerId(element.id);
                            }}
                          >
                            {element.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaArrowAltCircleUp
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerUp(element.id);
                          }}
                          title="Move Up"
                          className="cursor-pointer w-4 h-4"
                        />

                        <FaArrowAltCircleDown
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerDown(element.id);
                          }}
                          title="Move Down"
                          className="cursor-pointer w-4 h-4"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === element.id
                                  ? { ...el, visible: !el.visible }
                                  : el,
                              ),
                            );
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {element.visible ? "👁️" : "🗨️"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === element.id
                                  ? { ...el, locked: !el.locked }
                                  : el,
                              ),
                            );
                          }}
                          title={element.locked ? "Unlock" : "Lock"}
                        >
                          {element.locked ? "🔒" : "🔓"}
                        </button>
                        {(element.type === "image" ||
                          element.type === "graphic") && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <label
                              className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 hover:text-gray-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={element.isBackground || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setElements((prev) =>
                                    prev.map((el) =>
                                      el.id === element.id
                                        ? {
                                            ...el,
                                            isBackground: e.target.checked,
                                          }
                                        : el,
                                    ),
                                  );
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="font-medium">Bg</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Layer Name with Rename Functionality */}
                  </div>
                ))}
            </div>
          </div>
        )}
        {!showLayerPanel && (
          <button
            onClick={() => setShowLayerPanel(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 hover:bg-gray-50"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="4" />
              <rect x="3" y="10" width="18" height="4" />
              <rect x="3" y="17" width="18" height="4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
export default DesignStudio;
