/** Imprime el recibo térmico ESC/POS (72 mm / 576 dots) y manda el corte al terminar el texto. */

type SerialPortLike = {
  open: (opts: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};

type SerialNav = {
  getPorts: () => Promise<SerialPortLike[]>;
  requestPort: () => Promise<SerialPortLike>;
};

export function printPdfBlob(blob: Blob): void {
  const type = (blob.type || '').toLowerCase();
  if (isImageType(type)) {
    void printThermalOrFallback(blob);
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
      const isEscPos = bytes.length >= 2 && bytes[0] === 0x1b && bytes[1] === 0x40;
      if (isEscPos) {
        void blob.arrayBuffer().then((body) =>
          writeToSerialPrinter(new Uint8Array(body)).then((ok) => {
            if (!ok) printReceiptImage(blob);
          }),
        );
        return;
      }
      if (isPng) void printThermalOrFallback(blob);
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

function serialNav(): SerialNav | null {
  const serial = (navigator as unknown as { serial?: SerialNav }).serial;
  return serial ?? null;
}

async function printThermalOrFallback(blob: Blob): Promise<void> {
  try {
    const escpos = await pngBlobToEscPos(blob);
    if (await writeToSerialPrinter(escpos)) return;
  } catch {
    /* fallback Chrome */
  }
  printReceiptImage(blob);
}

async function pngBlobToEscPos(blob: Blob): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, width, height);
  bitmap.close();

  const widthBytes = Math.ceil(width / 8);
  const chunks: number[] = [0x1b, 0x40, 0x1b, 0x33, 0x00];
  const maxBand = 1600;
  for (let y0 = 0; y0 < height; y0 += maxBand) {
    const bandH = Math.min(maxBand, height - y0);
    chunks.push(
      0x1d,
      0x76,
      0x30,
      0x00,
      widthBytes & 0xff,
      (widthBytes >> 8) & 0xff,
      bandH & 0xff,
      (bandH >> 8) & 0xff,
    );
    for (let y = y0; y < y0 + bandH; y++) {
      for (let xb = 0; xb < widthBytes; xb++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = xb * 8 + bit;
          if (x >= width) continue;
          const i = (y * width + x) * 4;
          const lum = img.data[i];
          if (lum < 128) byte |= 0x80 >> bit;
        }
        chunks.push(byte);
      }
    }
  }
  chunks.push(0x1b, 0x4a, 0x28, 0x1d, 0x56, 0x00);
  return Uint8Array.from(chunks);
}

async function writeToSerialPrinter(data: Uint8Array): Promise<boolean> {
  const serial = serialNav();
  if (!serial) return false;
  let port: SerialPortLike | null = null;
  try {
    const ports = await serial.getPorts();
    port = ports[0] ?? (await serial.requestPort());
  } catch {
    return false;
  }
  if (!port) return false;
  const bauds = [9600, 115200, 19200, 38400];
  for (const baudRate of bauds) {
    try {
      await port.open({ baudRate });
      const writer = port.writable?.getWriter();
      if (!writer) {
        await port.close().catch(() => undefined);
        continue;
      }
      await writer.write(data);
      writer.releaseLock();
      await port.close().catch(() => undefined);
      return true;
    } catch {
      await port.close().catch(() => undefined);
    }
  }
  return false;
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
  const heightMm = Math.min(
    208,
    Math.max(30, (naturalHeight / Math.max(naturalWidth, 1)) * widthMm),
  );
  const iframe = document.createElement('iframe');
  iframe.title = 'Imprimir recibo';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `position:fixed;left:-120vw;top:0;width:${widthMm}mm;height:${heightMm}mm;border:0;background:#fff;`;
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
    html, body {
      margin: 0;
      padding: 0;
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      overflow: hidden;
      background: #fff;
    }
    img { width: ${widthMm}mm; height: auto; display: block; }
    @media print {
      html, body { width: ${widthMm}mm; height: ${heightMm}mm; margin: 0; overflow: hidden; }
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
  const printWhenReady = (): void => {
    if (!img || img.naturalWidth < 1) return;
    window.setTimeout(triggerPrint, 250);
  };
  if (img) {
    img.onload = printWhenReady;
    img.onerror = () => window.open(dataUrl, '_blank');
    if (img.complete) printWhenReady();
  }
  window.setTimeout(() => iframe.remove(), 180_000);
}

function printReceiptPdfIframe(blob: Blob): void {
  const pdf =
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdf);
  const iframe = document.createElement('iframe');
  iframe.title = 'Imprimir recibo';
  iframe.style.cssText = 'position:fixed;left:-120vw;top:0;width:72mm;height:210mm;border:0;';
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
