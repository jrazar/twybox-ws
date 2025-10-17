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

// Iniciar servidor solo si Passenger no lo controla
if (!module.parent) {
  server.listen(PORT, () => console.log(`HTTP+WS en puerto ${PORT}`));
}

// Exportar para Passenger
module.exports = app;
