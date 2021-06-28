let ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

ws.onmessage = (event) => {
  console.log(event.data);
};