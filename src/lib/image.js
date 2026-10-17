// Turns any photo into a small square JPEG for profile pictures.
export async function squareImage(file, size = 256) {
  if (!file?.type?.startsWith('image/')) throw new Error('Please choose a photo (JPG or PNG).');
  const bitmap = await loadImage(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Crop the centre of the photo so faces stay in the middle.
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('This photo could not be read.'))), 'image/jpeg', 0.85),
  );
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This photo could not be read. Try a JPG or PNG.'));
    };
    img.src = url;
  });
}

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();
