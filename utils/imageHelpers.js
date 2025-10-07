export const getPhotoDims = (projectData) => {
  try {
    const firstArtwork = projectData?.artworks?.[0];
    const settings = firstArtwork?.settings || {};
    const w = Number(settings.photo_width) || null;
    const h = Number(settings.photo_height) || null;
    if (w && h) return { w, h };
  } catch {
    return { w: 700, h: 700 };
  }
  return { w: 700, h: 700 };
};

export const dataURLToBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpg";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

export const fetchImageAsBlob = async (url) => {
  try {
    const response = await fetch(url, { cache: "no-store" });
    const blob = await response.blob();
    return blob;
  } catch (err) {
    console.error("Failed to fetch image:", err);
    throw err;
  }
};

export const generateFilename = () => {
  const now = new Date();
  return `image-${now.toLocaleString("en-GB").replace(/[/, ]/g, "_").replace(/:/g, "-")}.jpg`;
};
