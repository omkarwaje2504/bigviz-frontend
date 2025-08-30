import fs from "fs";
import path from "path";

export const loadImageAsBase64 = (filePath) => {
  try {
    const absPath = path.join(process.cwd(), "public", filePath);
    const data = fs.readFileSync(absPath);
    const ext = path.extname(filePath).substring(1);
    return `data:image/${ext};base64,${data.toString("base64")}`;
  } catch (err) {
    console.error(`Failed to load image: ${filePath}`, err);
    return null;
  }
};

export const preloadAssetsBase64 = () => {
  const doctorFrames = Array.from({ length: 52 }, (_, i) =>
    loadImageAsBase64(`/doctor/doctor${String(i).padStart(2, "0")}.webp`)
  );
  const patientFrames = Array.from({ length: 52 }, (_, i) =>
    loadImageAsBase64(`/patient/patient${String(i).padStart(2, "0")}.webp`)
  );

  const bgTexture = loadImageAsBase64("/bg.jpg");
  const scratchImage = loadImageAsBase64("/scratch-card.png");
  console.log("assests loaded")
  return {
    doctorFrames,
    patientFrames,
    bgTexture,
    scratchImage,
  };
};
