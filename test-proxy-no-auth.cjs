#!/usr/bin/env node

/**
 * Simple test proxy server for demonstrating OpenClaw with no API key authentication
 * This proxy simulates an Anthropic-compatible endpoint that doesn't require API keys
 */

const http = require('http');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    // Handle health check
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        message: 'Proxy server running (no authentication required)',
        endpoint: 'POST /v1/messages for Anthropic-compatible requests'
      }));
      return;
    }

    // Handle Anthropic-compatible messages endpoint
    if (req.url === '/v1/messages' && req.method === 'POST') {
      try {
        const requestData = JSON.parse(body);
        
        // Simulate a response
        const mockResponse = {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: `Mock response from no-auth proxy. OpenClaw works with proxies without API keys!\n\nYour message: ${requestData.messages?.[0]?.content || 'no message'}`
            }
          ],
          model: requestData.model || 'claude-opus-4',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 30 }
        };

        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        });
        res.end(JSON.stringify(mockResponse));
        console.log('✓ Returned mock response');
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Handle unknown endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Proxy Server (No Authentication Required)           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running at http://127.0.0.1:${PORT}`);
  console.log('✓ No API key required');
  console.log('✓ Anthropic-compatible endpoint: POST /v1/messages');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
