import { MdOutlineCancel } from "react-icons/md";

type PreviewModalProps = {
  previewType: string;
  previewUrl: string;
  setPreviewMode: (mode: boolean) => void;
};
const PreviewModal: React.FC<PreviewModalProps> = ({
  previewType,
  previewUrl,
  setPreviewMode,
}) => {
  return (
    <div
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-10 bg-slate-900/80 transition-all duration-300 ease-in-out"
      style={{
        zIndex: 1000,
      }}
    >
      <div className="flex flex-col items-center justify-center p-3 w-full md:max-w-[50%] h-full max-h-[75%] relative">
        <MdOutlineCancel
          className="w-10 h-10 fill-black mb-2 z-10 self-end cursor-pointer absolute top-0 bg-white rounded-full border border-black"
          onClick={() => setPreviewMode(false)}
        />

        {/* Image Preview */}
        {previewType === "IMAGE" && (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain border-4 border-white rounded-2xl overflow-hidden"
            />
          </div>
        )}

        {/* PDF Preview */}
        {previewType === "PDF" && previewUrl && (
          <div className="w-full h-full">
            <iframe
              src={previewUrl}
              className="w-full h-full border-4 border-white rounded-2xl"
              title="PDF Preview"
            />
          </div>
        )}

        {/* Video Preview */}
        {previewType === "VIDEO" && previewUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <video
              controls
              className="max-w-full max-h-full border-4 border-white rounded-2xl"
              src={previewUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
