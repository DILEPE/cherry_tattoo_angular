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
