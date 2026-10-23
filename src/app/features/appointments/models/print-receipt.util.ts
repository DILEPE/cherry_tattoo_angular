/** Abre el diálogo de impresión del navegador para un PDF de recibo. */
export function printPdfBlob(blob: Blob): void {
  const pdf =
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdf);
  const iframe = document.createElement('iframe');
  iframe.title = 'Imprimir recibo';
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  iframe.src = url;
  const cleanup = (): void => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
    window.setTimeout(cleanup, 120_000);
  };
  document.body.appendChild(iframe);
}
