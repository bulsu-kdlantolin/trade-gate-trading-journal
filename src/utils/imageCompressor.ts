/**
 * Compresses an image File or Blob to a lightweight WebP/JPEG Base64 string.
 * Hardened against non-image mime types, excessive file sizes (>15MB), canvas context failures, and decode errors.
 */
  export async function compressImageFile(
    file: File | Blob,
    maxWidth = 1920,
    quality = 0.82
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('No image file provided.'));
      }

      // Guard against non-image mime types when MIME type is present
      if (file.type && !file.type.startsWith('image/')) {
        return reject(new Error(`Unsupported file type (${file.type}). Please select an image file.`));
      }

      // 15MB upper ceiling guard to protect memory and storage quotas
      const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return reject(new Error('Image exceeds 15MB size limit. Please upload a smaller screenshot.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') {
          return reject(new Error('Failed to read image data.'));
        }

        const img = new Image();
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (width <= 0 || height <= 0) {
              return reject(new Error('Invalid image dimensions.'));
            }

              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                // Graceful fallback to original dataUrl if 2D context is unavailable
                resolve(result);
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);

              // Prefer WebP for optimal compression
              const dataUrl = canvas.toDataURL('image/webp', quality);
              // If browser does not support WebP export (falls back to png without size reduction), try JPEG
              if (dataUrl.startsWith('data:image/png') && file.type === 'image/jpeg') {
                resolve(canvas.toDataURL('image/jpeg', quality));
              } else {
                resolve(dataUrl);
              }
            } catch {
              // Graceful fallback to raw data URL on unexpected canvas processing error
              resolve(result);
            }
          };

          img.onerror = () => {
            reject(new Error('Failed to decode image file. File may be corrupted.'));
          };

          img.src = result;
        };

        reader.onerror = () => {
          reject(new Error('Could not read the selected image file.'));
        };

        reader.readAsDataURL(file);
      });
  }

