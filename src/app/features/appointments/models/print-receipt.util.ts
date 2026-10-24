/** Abre el diálogo de impresión del navegador para un PDF de recibo (tira térmica). */
export function printPdfBlob(blob: Blob): void {
  const pdf =
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdf);
  const iframe = document.createElement('iframe');
  iframe.title = 'Imprimir recibo';
  // Tamaño real del rollo: un iframe 0×0 recorta el PDF en Zebra / Chrome.
  iframe.style.cssText =
    'position:fixed;left:-120vw;top:0;width:80mm;height:320mm;border:0;';
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
