process.title = `tuffy_estates_backend`;

const http = require('http');

// Create an HTTP server
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  console.log(`got client`, req.headers);
  res.end('okay');
});
srv.listen(11638);
