/**
 * Compresses an image file while maintaining high quality.
 * Resizes images larger than 1920x1920 to standard HD resolution to save space without pixelation.
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
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
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        let width = img.width;
        let height = img.height;
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
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
          0.95,
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
