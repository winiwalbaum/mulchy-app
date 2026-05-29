/**
 * Compresses an image file using the Canvas API before uploading to Supabase.
 * - Resizes to maxDimension on the longest side
 * - Exports as JPEG at the given quality
 * - Skips compression if the file is already small enough (< 200 KB)
 * - Falls back to original file on any error
 */
export const compressImage = (
  file: File,
  { maxDimension = 1200, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> => {
  return new Promise((resolve) => {
    // Already small enough — skip
    if (file.size < 200 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg", lastModified: Date.now() }
          );
          // If compression somehow made it bigger, keep the original
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback: upload original
    };

    img.src = url;
  });
};
