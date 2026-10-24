/** Imprime el recibo térmico ESC/POS (72 mm imprimibles en rollo de 80 mm). */
export function printPdfBlob(blob: Blob): void {
  const type = (blob.type || '').toLowerCase();
  if (type.includes('png') || type.includes('jpeg') || type.includes('webp') || type.includes('gif')) {
    printReceiptImage(blob);
    return;
  }
  printReceiptPdfIframe(blob);
}

function printReceiptImage(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const widthMm = 72;
    const heightMm = Math.max(80, (img.naturalHeight / Math.max(img.naturalWidth, 1)) * widthMm + 10);
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=420,height=900');
    if (!popup) {
      URL.revokeObjectURL(url);
      window.open(url, '_blank');
      return;
    }
    popup.document.open();
    popup.document.write(`<!DOCTYPE html>
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
<body><img src="${url}" alt="Orden de trabajo"/></body>
</html>`);
    popup.document.close();
    const trigger = (): void => {
      try {
        popup.focus();
        popup.print();
      } catch {
        window.open(url, '_blank');
      }
    };
    popup.onload = () => window.setTimeout(trigger, 300);
    window.setTimeout(trigger, 600);
    window.setTimeout(() => {
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      URL.revokeObjectURL(url);
    }, 180_000);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    printReceiptPdfIframe(blob);
  };
  img.src = url;
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
