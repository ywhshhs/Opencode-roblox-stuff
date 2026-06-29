#!/usr/bin/env node
/**
 * Kimchi OpenAI-Compatible Proxy Server
 * 
 * Routes OpenAI API requests through kimchi CLI.
 * 
 * Usage:
 *   node server.js [--port PORT]
 * 
 * Then point your OpenAI client to:
 *   base_url: http://localhost:PORT/v1
 */

const http = require('http');
const { spawn } = require('child_process');
const readline = require('readline');

// Parse arguments
const args = process.argv.slice(2);
let PORT = 3000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    PORT = parseInt(args[i + 1], 10);
  }
}

/**
 * Execute kimchi CLI with a prompt and return the response
 */
function executeKimchi(prompt, model = null, stream = false) {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt];
    
    // Only pass model if it looks like a valid kimchi model (contains / or is a known model)
    // The 'kimchi-local' name we return in /v1/models is just for OpenAI compatibility
    if (model && model !== 'kimchi-local' && !model.startsWith('kimchi-')) {
      args.push('--model', model);
    }
    
    const proc = spawn('kimchi', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Close stdin so kimchi can proceed
    proc.stdin.end();
    
    proc.on('close', (code) => {
      if (code !== 0 && !stdout) {
        reject(new Error(`kimchi exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Build prompt from OpenAI messages array
 */
function buildPrompt(messages) {
  if (!messages || messages.length === 0) {
    return '';
  }
  
  // Simple concatenation: combine system + user messages
  let parts = [];
  
  for (const msg of messages) {
    const role = msg.role || 'user';
    const content = typeof msg.content === 'string' ? msg.content : 
                   (Array.isArray(msg.content) ? msg.content.map(c => c.text || '').join('') : '');
    
    if (role === 'system') {
      parts.push(`[System]: ${content}`);
    } else if (role === 'assistant') {
      parts.push(`[Assistant]: ${content}`);
    } else {
      parts.push(content);
    }
  }
  
  return parts.join('\n\n');
}

/**
 * Generate OpenAI-compatible response
 */
function formatResponse(content, model, requestId) {
  const id = requestId || `chatcmpl-${Date.now()}`;
  const modelUsed = model || 'kimchi-local';
  
  return {
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: modelUsed,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 0,  // kimchi doesn't report these
      completion_tokens: 0,
      total_tokens: 0
    }
  };
}

/**
 * Stream response chunks in OpenAI SSE format
 */
function* streamChunks(content, model, requestId) {
  const id = requestId || `chatcmpl-${Date.now()}`;
  const modelUsed = model || 'kimchi-local';
  
  // Split content into chunks (simulate token-by-token)
  const words = content.split(/(\s+)/);
  
  for (let i = 0; i < words.length; i++) {
    const chunk = {
      id,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: modelUsed,
      choices: [{
        index: 0,
        delta: { content: words[i] },
        finish_reason: null
      }]
    };
    yield `data: ${JSON.stringify(chunk)}\n\n`;
  }
  
  // Final chunk with finish_reason
  const finalChunk = {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: modelUsed,
    choices: [{
      index: 0,
      delta: {},
      finish_reason: 'stop'
    }]
  };
  yield `data: ${JSON.stringify(finalChunk)}\n\n`;
  yield `data: [DONE]\n\n`;
}

/**
 * Handle requests
 */
async function handleRequest(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'kimchi-proxy' }));
    return;
  }
  
  // Models endpoint (required by some clients)
  if (req.method === 'GET' && (req.url === '/v1/models' || req.url === '/models')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [
        { id: 'kimchi-local', object: 'model', created: Date.now(), owned_by: 'local' }
      ]
    }));
    return;
  }
  
  // Chat completions endpoint
  if (req.method === 'POST' && (req.url === '/v1/chat/completions' || req.url === '/chat/completions')) {
    let body = '';
    
    req.on('data', (chunk) => { body += chunk; });
    
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const { messages, model, stream = false } = request;
        
        console.log(`[${new Date().toISOString()}] Request: model=${model}, messages=${messages?.length}, stream=${stream}`);
        
        const prompt = buildPrompt(messages);
        console.log(`[${new Date().toISOString()}] Prompt (first 100 chars): ${prompt.substring(0, 100)}...`);
        
        const response = await executeKimchi(prompt, model, stream);
        
        console.log(`[${new Date().toISOString()}] Response (first 100 chars): ${response.substring(0, 100)}...`);
        
        if (stream) {
          // Streaming response
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          
          for (const chunk of streamChunks(response, model)) {
            res.write(chunk);
          }
          
          res.end();
        } else {
          // Non-streaming response
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(formatResponse(response, model)));
        }
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: {
            message: error.message,
            type: 'proxy_error',
            code: 'kimchi_error'
          }
        }));
      }
    });
    
    return;
  }
  
  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message: 'Not found', type: 'invalid_request_error' } }));
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          Kimchi OpenAI-Compatible Proxy Server           ║
╠═══════════════════════════════════════════════════════════╣
║  Server:   http://localhost:${PORT}                          ║
║  Endpoint: http://localhost:${PORT}/v1/chat/completions     ║
║  Health:   http://localhost:${PORT}/health                   ║
╚═══════════════════════════════════════════════════════════╝

Usage with OpenAI SDK:
  from openai import OpenAI
  
  client = OpenAI(
      base_url="http://localhost:${PORT}/v1",
      api_key="not-needed"
  )
  
  response = client.chat.completions.create(
      model="kimchi-local",
      messages=[{"role": "user", "content": "Hello!"}]
  )
  
  print(response.choices[0].message.content)
`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try --port <number>`);
    process.exit(1);
  }
  throw err;
});
