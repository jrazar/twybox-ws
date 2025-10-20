// server.js — versión CommonJS compatible con Passenger
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint simple
app.get('/health', (_req, res) => res.json({ ok: true }));

// Servidor HTTP + WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
      }
    } catch {}
  });
});

// Endpoint que recibe el disparo desde PHP
app.post('/disparo', express.json(), (req, res) => {  
  const data = req.body || {};
  console.log('POST /disparo recibido:', data);

  // Enviar mensaje a todos los clientes conectados
  const msg = {
    type: 'TRIGGER_FLOW',
    flowId: data.flowId,   // ahora viene dinámico desde PHP
    payload: data || {}

  };

  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(JSON.stringify(msg));
  });

  res.json({ status: 'ok', reenviado: msg });
});

// Iniciar servidor solo si Passenger no lo controla
if (!module.parent) {
  server.listen(PORT, () => console.log(`HTTP+WS en puerto ${PORT}`));
}

// Exportar para Passenger
module.exports = app;

