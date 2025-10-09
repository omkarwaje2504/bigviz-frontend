import { FaCamera, FaRegImage } from "react-icons/fa";

export const ImageUploadButton = ({
  ui,
  onFileSelect,
  isRxPadImage,
  projectData,
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = "";
  };

  return (
    <>
      <label
        htmlFor="fileUploadCamera"
        style={{
          background: ui.basic.primaryColor,
          color: ui.basic.primaryText,
        }}
        className="group relative flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-md font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition cursor-pointer"
      >
        <FaCamera />
        Open Camera
      </label>

      <input
        id="fileUploadCamera"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className="relative border-2 mt-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center h-80 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition"
        onClick={() => document.getElementById("fileUploadGallery").click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onFileSelect(file);
        }}
      >
        <div className="text-gray-400 mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
          <FaRegImage size={48} />
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
          {projectData?.project_hash === "j02y1r2m"
            ? "Choose photo from gallery or take a photo on the spot from phone"
            : isRxPadImage
              ? "Drag and drop your RxPad image here, or click to browse"
              : "Drag and drop your photo here, or click to browse"}
        </p>
        <p className="text-gray-400 dark:text-gray-500 mb-6 text-sm">
          Supported formats:{" "}
          {projectData?.project_hash === "j02y1r2m"
            ? "PDF, JPG, PNG"
            : "JPG, PNG, WEBP"}
        </p>
      </div>

      <input
        id="fileUploadGallery"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};