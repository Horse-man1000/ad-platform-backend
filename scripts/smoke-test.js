const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Running smoke tests against ${BASE_URL}`);

  const health = await request("/health");
  assert(health.response.status === 200, "Health endpoint failed");

  const version = await request("/version");
  assert(version.response.status === 200, "Version endpoint failed");

  const createClient = await request("/api/clients", {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke Client",
      email: `smoke-${Date.now()}@adplatform.local`,
    }),
  });
  assert(createClient.response.status === 201, "Client creation failed");
  const clientId = createClient.body.data.id;

  const saveToken = await request("/api/tokens", {
    method: "POST",
    body: JSON.stringify({
      clientId,
      platform: "google",
      accessToken: "abc123456789TOKEN",
      refreshToken: "ref987654321TOKEN",
      expiresAt: "2026-12-31T00:00:00.000Z",
    }),
  });
  assert(saveToken.response.status === 200, "Token save failed");

  const getToken = await request(`/api/tokens/${clientId}/google`);
  assert(getToken.response.status === 200, "Token fetch failed");

  const saveAccount = await request("/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      clientId,
      platform: "google",
      externalAccountId: `acct_smoke_${Date.now()}`,
      name: "Smoke Account",
    }),
  });
  assert(saveAccount.response.status === 201, "Account save failed");
  const accountId = saveAccount.body.data.id;

  const getAccount = await request(`/api/accounts/${accountId}`);
  assert(getAccount.response.status === 200, "Account fetch failed");

  const getClient = await request(`/api/clients/${clientId}`);
  assert(getClient.response.status === 200, "Client fetch failed");

  console.log("Smoke tests passed.");
}

main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
