/** Valida firma dibujada (data URL) o texto de respaldo del lienzo. */
export function isSignatureAcceptable(value: string | null | undefined): boolean {
  if (value == null) return false;
  const v = value.trim();
  if (v.length < 80) return false;
  if (v.startsWith('data:image/')) {
    const parts = v.split(',', 2);
    return parts.length === 2 && parts[1].trim().length >= 40;
  }
  return v.length >= 4;
}

export function isDocumentCaptureAcceptable(value: string | null | undefined): boolean {
  if (value == null) return false;
  const v = value.trim();
  return v.length >= 80 && v.startsWith('data:image/');
}

/** Data URL lista para mostrar en `<img src>`. */
export function signatureImageSrc(value: string | null | undefined): string | null {
  if (value == null) return null;
  const v = value.trim();
  return v.startsWith('data:image/') ? v : null;
}

export const DOCUMENT_CAPTURE_WATERMARK = 'SOLO AUTORIZADO PARA ESTE PROCEDIMIENTO';

/** Superpone la marca de agua de autorización sobre una imagen de documento (data URL). */
export function applyDocumentCaptureWatermark(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const minSide = Math.min(canvas.width, canvas.height);
      const fontSize = Math.max(18, Math.min(48, minSide * 0.075));
      ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 7);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.strokeStyle = 'rgba(30, 30, 30, 0.28)';
      ctx.lineWidth = Math.max(1, fontSize * 0.07);
      ctx.strokeText(DOCUMENT_CAPTURE_WATERMARK, 0, 0);
      ctx.fillText(DOCUMENT_CAPTURE_WATERMARK, 0, 0);
      ctx.restore();

      const result = canvas.toDataURL('image/jpeg', 0.88);
      resolve(isDocumentCaptureAcceptable(result) ? result : null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function readImageFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      resolve(result && isDocumentCaptureAcceptable(result) ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** Lee un archivo de imagen y devuelve data URL con marca de agua de documento. */
export async function readDocumentCaptureImage(file: File): Promise<string | null> {
  const raw = await readImageFileAsDataUrl(file);
  if (!raw) return null;
  return applyDocumentCaptureWatermark(raw);
}
