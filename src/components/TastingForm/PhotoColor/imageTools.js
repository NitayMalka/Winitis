/** Load a user photo honouring EXIF orientation, downscaled for performance. */
export const MAX_DIM = 1600;

function viaImgElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ src: img, w: img.naturalWidth, h: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image')); };
    img.style.imageOrientation = 'from-image';
    img.src = url;
  });
}

export async function loadPhoto(file, maxDim = MAX_DIM) {
  if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('Please choose an image file');
  let r;
  try {
    // imageOrientation:'from-image' applies the EXIF rotation (phones store portrait shots rotated).
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    r = { src: bmp, w: bmp.width, h: bmp.height, cleanup: () => bmp.close && bmp.close() };
  } catch (_) {
    r = await viaImgElement(file); // modern browsers auto-orient <img> too
  }
  const s = Math.min(1, maxDim / Math.max(r.w, r.h));
  const width = Math.max(1, Math.round(r.w * s)), height = Math.max(1, Math.round(r.h * s));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(r.src, 0, 0, width, height);
  r.cleanup();
  return { canvas, imageData: ctx.getImageData(0, 0, width, height), width, height, originalWidth: r.w, originalHeight: r.h, name: file.name || 'photo' };
}
