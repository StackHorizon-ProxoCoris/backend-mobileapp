const { once } = require('events');
const { spawn } = require('child_process');
const path = require('path');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseBody(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10_000)}@example.com`;
}

function rateLimitSummary(headers) {
  return {
    rateLimit: headers.ratelimit,
    rateLimitPolicy: headers['ratelimit-policy'],
    retryAfter: headers['retry-after'],
  };
}

async function request(baseUrl, pathname, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const requestHeaders = { ...headers };
  const init = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: parseBody(text),
    text,
  };
}

async function waitForHealthy(baseUrl, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }

      lastError = new Error(`Health check returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await wait(500);
  }

  throw lastError || new Error('Timed out waiting for backend health check');
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill();
  await Promise.race([once(child, 'exit'), wait(5_000)]);

  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await Promise.race([once(child, 'exit'), wait(5_000)]);
  }
}

async function startServer({ port, envOverrides = {} }) {
  const cwd = path.resolve(__dirname, '..', '..');
  const child = spawn(process.execPath, ['dist/index.js'], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'development',
      ...envOverrides,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  const baseUrl = `http://localhost:${port}`;

  try {
    await waitForHealthy(baseUrl);
  } catch (error) {
    await stopServer(child);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to start local backend for rate-limit verification: ${errorMessage}\n\n${output}`);
  }

  return {
    baseUrl,
    getLogs: () => output,
    stop: async () => {
      await stopServer(child);
    },
  };
}

module.exports = {
  assert,
  rateLimitSummary,
  request,
  startServer,
  uniqueEmail,
};
