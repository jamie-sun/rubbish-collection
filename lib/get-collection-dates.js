const AC_API = "https://experience.aucklandcouncil.govt.nz";

// The AC website is a Next.js app that uses React Server Actions. Each server
// action is identified by a hash baked into the JS bundles at build time.
// We scrape the page, scan its JS chunks for the hash tied to "getSessionToken",
// and use it as the Next-Action header value in subsequent requests
async function resolveNextActionHash(propertyId) {
  const pageRes = await fetch(
    `${AC_API}/en/rubbish-recycling/rubbish-recycling-collections/rubbish-recycling-collection-days/${propertyId}.html`,
    { headers: { "User-Agent": "bin-reminder-bot/1.0" } },
  );
  if (!pageRes.ok) throw new Error(`Page fetch failed: ${pageRes.status}`);
  const html = await pageRes.text();

  const chunkUrls = [
    ...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g),
  ].map((m) => m[0]);

  for (const path of chunkUrls) {
    const jsRes = await fetch(`${AC_API}${path}`, {
      headers: { "User-Agent": "bin-reminder-bot/1.0" },
    });
    if (!jsRes.ok) continue;
    const js = await jsRes.text();
    const m = js.match(
      /createServerReference[^"]*"([0-9a-f]{32,64})"[^"]*"getSessionToken"/,
    );
    if (m) return m[1];
  }

  throw new Error("Could not resolve Next-Action hash from JS bundles");
}

// Calls the server action to get a short-lived JWT, which is then used to
// authenticate against the rubbish collection API
async function getSessionToken(propertyId) {
  const hash = await resolveNextActionHash(propertyId);
  const res = await fetch(`${AC_API}/`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "Next-Action": hash,
    },
    body: "[]",
  });
  if (!res.ok) throw new Error(`Session token fetch failed: ${res.status}`);
  const text = await res.text();
  const match = text.match(/\d+:"(eyJ[^"]+)"/);
  if (!match) throw new Error("Could not extract session token from response");
  return match[1];
}

async function getCollectionDates(addressId) {
  const token = await getSessionToken(addressId);
  const res = await fetch(
    `${AC_API}/nextapi/property/${addressId}/rubbish-collection`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "bin-reminder-bot/1.0",
      },
    },
  );
  if (!res.ok)
    throw new Error(
      `Council API error: ${res.status} for addressId ${addressId}`,
    );

  const data = await res.json();
  return (data.collectionDates || []).map((c) => ({
    date: c.collectionDate.split("T")[0],
    isRubbish: c.isRubbish,
    isRecycling: c.isRecycling,
    isFoodScraps: c.isFoodScraps,
  }));
}

module.exports = { getCollectionDates };
