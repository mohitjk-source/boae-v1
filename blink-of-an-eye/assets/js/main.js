// Blink Of An Eye frontend JS
// Fetches directly from Cloudflare Pages Functions routes

const safeText = (s) =>
  (s || "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

const renderVideos = (items) => {
  const el = document.getElementById("videosGrid");
  el.innerHTML = items
    .map(
      (v) => `
    <article class="card">
      <iframe
        width="360" height="203"
        src="https://www.youtube.com/embed/${v.id}"
        title="${safeText(v.title)}"
        frameborder="0" allowfullscreen></iframe>
      <h3>${safeText(v.title)}</h3>
    </article>
  `
    )
    .join("");
};

const renderReviews = (items) => {
  const el = document.getElementById("reviewsGrid");
  el.innerHTML = items
    .map(
      (p) => `
    <article class="card">
      <a href="${p.permalink}" target="_blank" rel="noopener">
        <img src="${p.url}" alt="${safeText(p.caption || "Instagram media")}" loading="lazy" />
      </a>
      ${p.caption ? `<p>${safeText(p.caption)}</p>` : ""}
    </article>
  `
    )
    .join("");
};

(async function init() {
  try {
    // Directly call Pages Functions routes
    const [yt, ig] = await Promise.all([
      fetch("/boae-v1/blink-of-an-eye/youtube?limit=8").then((r) => r.json()),
      fetch("/boae-v1/blink-of-an-eye/instagram?limit=8").then((r) => r.json()),
    ]);

    renderVideos(yt.items || []);
    renderReviews(ig.items || []);
  } catch (e) {
    console.error("Fetch failed", e);
    document.getElementById("videosGrid").innerHTML = "<p>Episodes unavailable right now.</p>";
    document.getElementById("reviewsGrid").innerHTML = "<p>Reviews unavailable right now.</p>";
  }
})();
export interface Env {
  YOUTUBE_API_KEY: string;
  YOUTUBE_CHANNEL_ID: string;
  INSTAGRAM_ACCESS_TOKEN: string;
  // CACHE?: KVNamespace; // optional
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60", // client cache hint
};

const edgeCache = (minutes: number) => minutes * 60;

const withEdgeCache = async (request: Request, fetcher: () => Promise<Response>, minutes = 10) => {
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url), request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const res = await fetcher();
  // Only cache successful GET JSON responses
  if (res.ok && request.method === "GET") {
    const cacheable = new Response(res.body, res);
    cacheable.headers.set("cache-control", `public, max-age=${edgeCache(minutes)}`);
    await cache.put(cacheKey, cacheable);
    return cacheable;
  }
  return res;
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), { headers: JSON_HEADERS, ...init });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/youtube") {
        return withEdgeCache(request, async () => {
          const maxResults = Number(url.searchParams.get("limit") ?? 8);
          const api = `https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&channelId=${env.YOUTUBE_CHANNEL_ID}&maxResults=${maxResults}&key=${env.YOUTUBE_API_KEY}`;
          const r = await fetch(api, { cf: { cacheTtl: 0, cacheEverything: false } });
          if (!r.ok) return json({ error: "youtube_fetch_failed" }, { status: 502 });
          const data = await r.json();
          const minimal = (data.items ?? [])
            .filter((i: any) => i.id?.videoId)
            .map((i: any) => ({
              id: i.id.videoId,
              title: i.snippet.title,
              publishedAt: i.snippet.publishedAt,
              thumbnail: i.snippet.thumbnails?.medium?.url,
            }));
          return json({ items: minimal });
        }, 10);
      }

      if (url.pathname === "/instagram") {
        return withEdgeCache(request, async () => {
          const limit = Number(url.searchParams.get("limit") ?? 8);
          const fields = "id,caption,media_url,media_type,permalink,thumbnail_url,timestamp";
          const api = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}&limit=${limit}`;
          const r = await fetch(api, { cf: { cacheTtl: 0, cacheEverything: false } });
          if (!r.ok) return json({ error: "instagram_fetch_failed" }, { status: 502 });
          const data = await r.json();
          const minimal = (data.data ?? []).map((p: any) => ({
            id: p.id,
            caption: p.caption,
            url: p.media_url ?? p.thumbnail_url,
            type: p.media_type,
            permalink: p.permalink,
            timestamp: p.timestamp,
          }));
          return json({ items: minimal });
        }, 10);
      }

      // Health check
      if (url.pathname === "/health") {
        return json({ ok: true, time: new Date().toISOString() });
      }

      return json({ error: "not_found" }, { status: 404 });
    } catch (e: any) {
      return json({ error: "server_error", message: e?.message ?? "unknown" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
