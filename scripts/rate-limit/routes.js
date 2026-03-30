const {
  assert,
  rateLimitSummary,
  request,
  startServer,
  uniqueEmail,
} = require('./common');

function expectPolicy(headers, expectedQuota, label) {
  const policy = headers['ratelimit-policy'] || '';
  assert(policy.includes(`\"${expectedQuota}-in-15min\"`), `Expected ${label} policy to include ${expectedQuota}-in-15min, got ${policy || '[missing]'}`);
}

async function main() {
  const server = await startServer({
    port: 3102,
    envOverrides: {
      TRUST_PROXY: 'false',
      RATE_LIMIT_DEBUG: 'true',
      RATE_LIMIT_PUBLIC_AUTH_MAX_DEV: '3',
      RATE_LIMIT_AUTH_REFRESH_MAX_DEV: '2',
      RATE_LIMIT_AUTHENTICATED_GENERAL_MAX_DEV: '1',
      RATE_LIMIT_BMKG_MAX_DEV: '4',
      RATE_LIMIT_PUBLIC_READ_MAX_DEV: '5',
    },
  });

  try {
    const password = 'Passw0rd!';
    const emailOne = uniqueEmail('rate-limit.routes.a');
    const emailTwo = uniqueEmail('rate-limit.routes.b');

    const registerOne = await request(server.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        email: emailOne,
        password,
        fullName: 'Rate Limit Routes User',
      },
    });

    assert(registerOne.status === 201, `Expected first registration to succeed, got ${registerOne.status}`);

    const accessTokenOne = registerOne.body?.data?.accessToken;
    const refreshTokenOne = registerOne.body?.data?.refreshToken;

    assert(accessTokenOne, 'Missing first access token from registration response');
    assert(refreshTokenOne, 'Missing first refresh token from registration response');

    const loginOne = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: emailOne, password },
    });
    const loginTwo = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: emailOne, password },
    });
    const loginThree = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: emailOne, password },
    });

    assert(loginOne.status === 200, `Expected first login to succeed, got ${loginOne.status}`);
    assert(loginTwo.status === 200, `Expected second login to succeed, got ${loginTwo.status}`);
    assert(loginThree.status === 429, `Expected third login to hit publicAuth limit, got ${loginThree.status}`);
    expectPolicy(loginOne.headers, 3, 'publicAuth');

    const registerTwo = await request(server.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: {
        email: emailTwo,
        password,
        fullName: 'Rate Limit Routes User Two',
      },
    });

    assert(
      registerTwo.status === 201,
      `Expected second registration (different email, same IP) to remain unblocked, got ${registerTwo.status}`
    );

    const accessTokenTwo = registerTwo.body?.data?.accessToken;
    const refreshTokenTwo = registerTwo.body?.data?.refreshToken;

    assert(accessTokenTwo, 'Missing second access token from registration response');
    assert(refreshTokenTwo, 'Missing second refresh token from registration response');

    const loginTwoEmailOne = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: emailTwo, password },
    });
    const loginTwoEmailTwo = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: emailTwo, password },
    });
    const loginTwoEmailThree = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: emailTwo, password },
    });

    assert(
      loginTwoEmailOne.status === 200,
      `Expected first login for second email to succeed, got ${loginTwoEmailOne.status}`
    );
    assert(
      loginTwoEmailTwo.status === 200,
      `Expected second login for second email to succeed, got ${loginTwoEmailTwo.status}`
    );
    assert(
      loginTwoEmailThree.status === 429,
      `Expected third login for second email to hit its own publicAuth limit, got ${loginTwoEmailThree.status}`
    );

    const meOne = await request(server.baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${accessTokenOne}` },
    });
    const meTwo = await request(server.baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${accessTokenOne}` },
    });

    assert(meOne.status === 200, `Expected authenticated request to stay separate from login bucket, got ${meOne.status}`);
    assert(meTwo.status === 429, `Expected second authenticated request to hit authenticatedGeneral limit, got ${meTwo.status}`);
    expectPolicy(meOne.headers, 1, 'authenticatedGeneral');

    const refreshOne = await request(server.baseUrl, '/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refreshTokenOne },
    });
    const refreshTwo = await request(server.baseUrl, '/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refreshTokenOne },
    });
    const refreshThree = await request(server.baseUrl, '/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refreshTokenOne },
    });

    assert(refreshOne.status === 200, `Expected first refresh to succeed, got ${refreshOne.status}`);
    assert(refreshTwo.status === 200, `Expected second refresh to succeed, got ${refreshTwo.status}`);
    assert(refreshThree.status === 429, `Expected third refresh to hit authRefresh limit, got ${refreshThree.status}`);
    expectPolicy(refreshOne.headers, 2, 'authRefresh');

    const refreshOtherToken = await request(server.baseUrl, '/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refreshTokenTwo },
    });
    assert(
      refreshOtherToken.status === 200,
      `Expected different refresh token on same IP to remain unblocked, got ${refreshOtherToken.status}`
    );

    const publicReadResponses = [];
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const response = await request(server.baseUrl, '/api/reports/stats');
      publicReadResponses.push({ attempt, response });
    }

    assert(
      publicReadResponses[0].response.status !== 429,
      `Expected first public report read to avoid throttling, got ${publicReadResponses[0].response.status}`
    );
    assert(
      publicReadResponses[5].response.status === 429,
      `Expected sixth public report read to hit publicRead limit, got ${publicReadResponses[5].response.status}`
    );
    expectPolicy(publicReadResponses[0].response.headers, 5, 'publicRead');

    const reportWriteAfterReadExhaustion = await request(server.baseUrl, '/api/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessTokenTwo}` },
      body: {
        category: 'Banjir',
        title: 'Rate limit scope isolation check',
        description: 'Ensure POST /api/reports is not throttled by publicRead bucket',
        address: 'Jl. Braga No. 1, Bandung',
        lat: -6.914744,
        lng: 107.60981,
      },
    });

    assert(
      reportWriteAfterReadExhaustion.status !== 429,
      `Expected authenticated report write to remain unblocked after exhausting public reads, got ${reportWriteAfterReadExhaustion.status}`
    );
    expectPolicy(reportWriteAfterReadExhaustion.headers, 1, 'authenticatedGeneral');

    const bmkgResponses = [];
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(server.baseUrl, '/api/bmkg/gempa-terkini');
      bmkgResponses.push({ attempt, response });
    }

    assert(bmkgResponses[0].response.status !== 429, `Expected first BMKG request to avoid throttling, got ${bmkgResponses[0].response.status}`);
    assert(bmkgResponses[4].response.status === 429, `Expected fifth BMKG request to hit bmkg limit, got ${bmkgResponses[4].response.status}`);
    expectPolicy(bmkgResponses[0].response.headers, 4, 'bmkg');

    console.log('verify:rate-limit:routes passed');
    console.log(JSON.stringify({
        checks: {
          publicAuth: {
            registerOne: { status: registerOne.status, ...rateLimitSummary(registerOne.headers) },
            loginOne: { status: loginOne.status, ...rateLimitSummary(loginOne.headers) },
            loginTwo: { status: loginTwo.status, ...rateLimitSummary(loginTwo.headers) },
            loginThree: { status: loginThree.status, ...rateLimitSummary(loginThree.headers) },
            registerTwo: { status: registerTwo.status, ...rateLimitSummary(registerTwo.headers) },
            loginTwoEmailOne: { status: loginTwoEmailOne.status, ...rateLimitSummary(loginTwoEmailOne.headers) },
            loginTwoEmailTwo: { status: loginTwoEmailTwo.status, ...rateLimitSummary(loginTwoEmailTwo.headers) },
            loginTwoEmailThree: { status: loginTwoEmailThree.status, ...rateLimitSummary(loginTwoEmailThree.headers) },
          },
          authenticatedGeneral: {
            meOne: { status: meOne.status, ...rateLimitSummary(meOne.headers) },
            meTwo: { status: meTwo.status, ...rateLimitSummary(meTwo.headers) },
            reportWriteAfterReadExhaustion: {
              status: reportWriteAfterReadExhaustion.status,
              ...rateLimitSummary(reportWriteAfterReadExhaustion.headers),
            },
          },
          authRefresh: {
            refreshOne: { status: refreshOne.status, ...rateLimitSummary(refreshOne.headers) },
            refreshTwo: { status: refreshTwo.status, ...rateLimitSummary(refreshTwo.headers) },
            refreshThree: { status: refreshThree.status, ...rateLimitSummary(refreshThree.headers) },
            refreshOtherToken: { status: refreshOtherToken.status, ...rateLimitSummary(refreshOtherToken.headers) },
          },
          publicRead: publicReadResponses.map(({ attempt, response }) => ({
            attempt,
            status: response.status,
            ...rateLimitSummary(response.headers),
          })),
          bmkg: bmkgResponses.map(({ attempt, response }) => ({
            attempt,
            status: response.status,
            ...rateLimitSummary(response.headers),
        })),
      },
    }, null, 2));
  } finally {
    await server.stop();
  }
}

main().catch((error) => {
  console.error('verify:rate-limit:routes failed');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
