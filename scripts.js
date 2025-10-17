const TOKEN = 'CAMBIA_ESTE_TOKEN';
const WS_URL = 'ws://TU_HOST:8081?token=' + encodeURIComponent(TOKEN);
// Si tenés Nginx+SSL: 'wss://ws.tudominio.com?token=...'

const socket = new WebSocket(WS_URL);

socket.addEventListener('open', () => {
  console.log('WS conectado');
});

socket.addEventListener('message', (ev) => {
  let data;
  try { data = JSON.parse(ev.data); } catch { return; }

  if (data.type === 'TRIGGER_FLOW') {
    // acá llamás a tu función de animación:
    // animateFlow(data.flowId, data.payload);
    console.log('Disparo recibido', data);
  }
});

// Atajo teclado (Ctrl+N -> flow 21-22 a modo de ejemplo)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'n') {
    const msg = {
      type: 'TRIGGER_FLOW',
      flowId: '21-22',
      payload: { speed: 1, count: 1, meta: { source: 'keyboard' } },
      token: TOKEN
    };
    socket.readyState === 1 && socket.send(JSON.stringify(msg));
  }
});
