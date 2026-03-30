const {
  assert,
  rateLimitSummary,
  request,
  startServer,
  uniqueEmail,
} = require('./common');

async function main() {
  const server = await startServer({
    port: 3101,
    envOverrides: {
      TRUST_PROXY: 'false',
      RATE_LIMIT_DEBUG: 'true',
      RATE_LIMIT_AUTHENTICATED_GENERAL_MAX_DEV: '2',
    },
  });

  try {
    const password = 'Passw0rd!';
    const userAEmail = uniqueEmail('rate-limit.user-a');
    const userBEmail = uniqueEmail('rate-limit.user-b');

    const registerUserA = await request(server.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        email: userAEmail,
        password,
        fullName: 'Rate Limit User A',
      },
    });
    const registerUserB = await request(server.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        email: userBEmail,
        password,
        fullName: 'Rate Limit User B',
      },
    });

    assert(registerUserA.status === 201, `Expected user A registration to succeed, got ${registerUserA.status}`);
    assert(registerUserB.status === 201, `Expected user B registration to succeed, got ${registerUserB.status}`);

    const accessTokenA = registerUserA.body?.data?.accessToken;
    const accessTokenB = registerUserB.body?.data?.accessToken;

    assert(accessTokenA, 'Missing access token for user A');
    assert(accessTokenB, 'Missing access token for user B');

    const meUserA1 = await request(server.baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${accessTokenA}` },
    });
    const meUserA2 = await request(server.baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${accessTokenA}` },
    });
    const meUserA3 = await request(server.baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${accessTokenA}` },
    });
    const meUserB1 = await request(server.baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${accessTokenB}` },
    });

    assert(meUserA1.status === 200, `Expected user A first /me request to succeed, got ${meUserA1.status}`);
    assert(meUserA2.status === 200, `Expected user A second /me request to succeed, got ${meUserA2.status}`);
    assert(meUserA3.status === 429, `Expected user A third /me request to hit 429, got ${meUserA3.status}`);
    assert(meUserB1.status === 200, `Expected user B /me request to stay isolated from user A, got ${meUserB1.status}`);

    const userAPolicy = meUserA1.headers['ratelimit-policy'];
    const userBPolicy = meUserB1.headers['ratelimit-policy'];

    assert(userAPolicy, 'Missing RateLimit-Policy header for user A');
    assert(userBPolicy, 'Missing RateLimit-Policy header for user B');
    assert(userAPolicy !== userBPolicy, 'Expected authenticated users to have different policy partition keys on the same host');

    console.log('verify:rate-limit:isolation passed');
    console.log(JSON.stringify({
      users: {
        userA: { email: userAEmail },
        userB: { email: userBEmail },
      },
      checks: {
        userAFirst: { status: meUserA1.status, ...rateLimitSummary(meUserA1.headers) },
        userASecond: { status: meUserA2.status, ...rateLimitSummary(meUserA2.headers) },
        userAThird: { status: meUserA3.status, ...rateLimitSummary(meUserA3.headers) },
        userBFirst: { status: meUserB1.status, ...rateLimitSummary(meUserB1.headers) },
      },
    }, null, 2));
  } finally {
    await server.stop();
  }
}

main().catch((error) => {
  console.error('verify:rate-limit:isolation failed');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
