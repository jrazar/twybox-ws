// server.js — versión CommonJS compatible con Passenger
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

// 🔹 Agregamos fetch dinámico (para llamar al PHP)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint simple para test
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

// 🔹 Endpoint principal que recibe el disparo
app.post('/disparo', express.json(), async (req, res) => {
  const data = req.body || {};
  console.log('POST /disparo recibido:', data);

  try {
    // 1️⃣ Llamar al PHP de reglas de negocio
    const phpResp = await fetch('https://twybox360.com/sistemas/scan/api_sc/mat_ensamble_unid.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await phpResp.json();
    console.log('Respuesta del PHP:', result);

    // 2️⃣ Enviar mensaje a todos los clientes conectados (tableros)
    const msg = {
      type: 'TRIGGER_FLOW',
      flowId: result?.flowId || '21-22',
      payload: result
    };

    wss.clients.forEach((c) => {
      if (c.readyState === 1) c.send(JSON.stringify(msg));
    });

    // 3️⃣ Responder al cliente que disparó
    res.json({ status: 'ok', reenviado: msg });

  } catch (err) {
    console.error('Error al comunicar con PHP:', err);
    res
      .status(500)
      .json({ status: 'error', mensaje: 'Fallo al comunicar con PHP', error: err.message });
  }
});

// Iniciar servidor solo si Passenger no lo controla
if (!module.parent) {
  server.listen(PORT, () => console.log(`HTTP+WS en puerto ${PORT}`));
}

// Exportar para Passenger
module.exports = app;
