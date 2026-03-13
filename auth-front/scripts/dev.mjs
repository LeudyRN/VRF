import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const viteCli = path.resolve('node_modules/vite/bin/vite.js');
if (fs.existsSync(viteCli)) {
  const child = spawn(process.execPath, [viteCli], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  const html = `<!doctype html><html><head><meta charset='utf-8'/><title>VRF Frontend</title><script src="https://cdn.tailwindcss.com"></script></head><body class='min-h-screen grid place-items-center bg-slate-100'><div class='bg-white shadow rounded-xl p-6 max-w-xl'><h1 class='text-2xl font-bold'>Frontend dependency issue</h1><p class='mt-2 text-slate-600'>Vite is not available in this environment. Backend APIs are running; install frontend dependencies to run the full React app.</p></div></body></html>`;
  http.createServer((_, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); }).listen(5173, () => {
    console.log('Fallback frontend server running at http://localhost:5173');
  });
}
