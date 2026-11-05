const http = require('http');

/**
 * El agente HTTP por defecto reutiliza conexiones. Con el listado de citas
 * (respuesta grande) esa reutilización deja el pipe a medias en Windows y el
 * panel se queda en «Cargando citas…». Cada petición abre su propia conexión
 * y la respuesta se entrega completa.
 */
const agent = new http.Agent({ keepAlive: false, maxSockets: 100 });

function sendBufferedResponse(proxy) {
  const on = proxy.on.bind(proxy);
  proxy.on = (event, handler) => {
    if (event !== 'proxyRes') {
      return on(event, handler);
    }
    return on('proxyRes', (proxyRes, req, res) => {
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        if (res.writableEnded) return;
        const body = Buffer.concat(chunks);
        const headers = { ...proxyRes.headers };
        delete headers['transfer-encoding'];
        headers['content-length'] = String(body.length);
        res.writeHead(proxyRes.statusCode || 502, headers);
        res.end(body);
      });
      proxyRes.on('error', () => {
        if (!res.writableEnded) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end('Error al contactar el API.');
        }
      });
      req.on('aborted', () => {
        if (!proxyRes.destroyed) proxyRes.destroy();
      });
    });
  };
}

const apiProxy = {
  target: 'http://127.0.0.1:5000',
  secure: false,
  changeOrigin: true,
  agent,
  selfHandleResponse: true,
  configure: sendBufferedResponse,
};

module.exports = {
  '/api': apiProxy,
  '/health': { ...apiProxy },
};
