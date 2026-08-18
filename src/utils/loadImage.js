// Small shared helper: load an <img> element from a URL or data URL,
// resolving once it's actually decoded and ready to be drawn onto a
// <canvas> or embedded into a jsPDF document.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Converts an already-loaded <img> into a PNG data URL via an offscreen
// canvas -- used where a library (like jsPDF) needs a data URL rather than
// an element.
export function imageToDataUrl(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}
