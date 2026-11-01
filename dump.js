import WebSocket from 'ws';
import fs from 'fs';

const ws = new WebSocket('ws://localhost:9229/586e36f9-445d-4730-a054-fe5b36ad486b');

let id = 1;
const send = (method, params = {}) => {
  return new Promise((resolve) => {
    const messageId = id++;
    const listener = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === messageId) {
        ws.removeListener('message', listener);
        resolve(msg.result);
      }
    };
    ws.on('message', listener);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
};

ws.on('open', async () => {
  console.log('Connected');
  
  const chunks = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'HeapProfiler.addHeapSnapshotChunk') {
      chunks.push(msg.params.chunk);
    }
  });

  console.log('Taking heap snapshot...');
  await send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  
  console.log('Saving snapshot...');
  fs.writeFileSync('/tmp/heap.heapsnapshot', chunks.join(''));
  console.log('Done!');
  ws.close();
});
