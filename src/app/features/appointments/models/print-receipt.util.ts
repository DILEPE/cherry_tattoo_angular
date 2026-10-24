/** Imprime el recibo térmico ESC/POS (72 mm imprimibles en rollo de 80 mm). */
export function printPdfBlob(blob: Blob): void {
  const type = (blob.type || '').toLowerCase();
  if (isImageType(type)) {
    printReceiptImage(blob);
    return;
  }
  void blob
    .slice(0, 8)
    .arrayBuffer()
    .then((buf) => {
      const bytes = new Uint8Array(buf);
      const isPng =
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47;
      if (isPng) printReceiptImage(blob);
      else printReceiptPdfIframe(blob);
    })
    .catch(() => printReceiptPdfIframe(blob));
}

function isImageType(type: string): boolean {
  return (
    type.includes('png') ||
    type.includes('jpeg') ||
    type.includes('jpg') ||
    type.includes('webp') ||
    type.includes('gif') ||
    type.startsWith('image/')
  );
}

function printReceiptImage(blob: Blob): void {
  const reader = new FileReader();
  reader.onerror = () => printReceiptPdfIframe(blob);
  reader.onload = () => {
    const dataUrl = String(reader.result || '');
    if (!dataUrl.startsWith('data:')) {
      printReceiptPdfIframe(blob);
      return;
    }
    const probe = new Image();
    probe.onerror = () => printReceiptPdfIframe(blob);
    probe.onload = () => openImagePrintFrame(dataUrl, probe.naturalWidth, probe.naturalHeight);
    probe.src = dataUrl;
  };
  reader.readAsDataURL(blob);
}

function openImagePrintFrame(dataUrl: string, naturalWidth: number, naturalHeight: number): void {
  const widthMm = 72;
  const heightMm = Math.max(80, (naturalHeight / Math.max(naturalWidth, 1)) * widthMm + 10);
  const iframe = document.createElement('iframe');
  iframe.title = 'Imprimir recibo';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:72mm;height:320mm;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    window.open(dataUrl, '_blank');
    return;
  }
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Orden de trabajo</title>
  <style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    html, body { margin: 0; padding: 0; width: ${widthMm}mm; background: #fff; }
    img { width: ${widthMm}mm; height: auto; display: block; }
    @media print {
      html, body { width: ${widthMm}mm; margin: 0; }
      img { width: ${widthMm}mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body><img src="${dataUrl}" alt="Orden de trabajo"/></body>
</html>`);
  doc.close();

  let printed = false;
  const triggerPrint = (): void => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(dataUrl, '_blank');
    }
  };

  const img = doc.querySelector('img');
  if (img) {
    if (img.complete && img.naturalWidth > 0) {
      window.setTimeout(triggerPrint, 200);
    } else {
      img.onload = () => window.setTimeout(triggerPrint, 200);
      img.onerror = triggerPrint;
    }
  } else {
    window.setTimeout(triggerPrint, 400);
  }
  window.setTimeout(triggerPrint, 1500);
  window.setTimeout(() => iframe.remove(), 180_000);
}

function printReceiptPdfIframe(blob: Blob): void {
  const pdf =
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdf);
  const iframe = document.createElement('iframe');
  iframe.title = 'Imprimir recibo';
  iframe.style.cssText = 'position:fixed;left:-120vw;top:0;width:72mm;height:320mm;border:0;';
  iframe.src = url;
  const cleanup = (): void => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };
  const triggerPrint = (): void => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
  };
  iframe.onload = () => window.setTimeout(triggerPrint, 250);
  document.body.appendChild(iframe);
  window.setTimeout(cleanup, 180_000);
}
