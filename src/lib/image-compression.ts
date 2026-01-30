/**
 * Compresses an image file while maintaining high quality.
 * Resizes images larger than 1920x1920 to standard HD resolution to save space without pixelation.
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. Fail fast if it's not an image
    if (!/image.*/.exec(file.type)) {
      return reject(new Error("File is not an image"));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");

        // 2. INCREASE MAX DIMENSIONS
        // 600px is too small for modern screens. 1920px is standard HD.
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Failed to get canvas context"));
        }

        // 3. OPTIONAL: Smoother resizing algorithm
        // 'pica' or similar libraries do this better, but this helps in vanilla JS
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);

        // 4. PRESERVE FILE TYPE IF PNG (to keep transparency)
        // If the original is PNG, we keep it PNG (lossless). If JPEG/other, we use JPEG.
        const outputType =
          file.type === "image/png" ? "image/png" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Canvas to Blob conversion failed"));
            }
            const newFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          outputType,
          0.95, // 5. QUALITY SETTING: 0.95 is very high quality (0.6 was the issue)
        );
      };

      img.onerror = () => {
        reject(new Error("Image failed to load."));
      };
    };

    reader.onerror = () => {
      reject(new Error("File could not be read."));
    };
  });
};
