const API = "https://api.soulwithoutjhol.com"; // your Worker route

const safeText = (s) => (s || "").replace(/[<>&"]/g, (c) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;" }[c]));

const renderVideos = (items) => {
  const el = document.getElementById("videosGrid");
  el.innerHTML = items.map(v => `
    <article class="card">
      <iframe
        width="360" height="203"
        src="https://www.youtube.com/embed/${v.id}"
        title="${safeText(v.title)}"
        frameborder="0" allowfullscreen></iframe>
      <h3>${safeText(v.title)}</h3>
    </article>
  `).join("");
};

const renderReviews = (items) => {
  const el = document.getElementById("reviewsGrid");
  el.innerHTML = items.map(p => `
    <article class="card">
      <a href="${p.permalink}" target="_blank" rel="noopener">
        <img src="${p.url}" alt="${safeText(p.caption || 'Instagram media')}" loading="lazy" />
      </a>
      ${p.caption ? `<p>${safeText(p.caption)}</p>` : ""}
    </article>
  `).join("");
};

(async function init() {
  try {
    const [yt, ig] = await Promise.all([
      fetch(`${API}/youtube?limit=8`).then(r => r.json()),
      fetch(`${API}/instagram?limit=8`).then(r => r.json()),
    ]);
    renderVideos(yt.items || []);
    renderReviews(ig.items || []);
  } catch (e) {
    console.error("Fetch failed", e);
    document.getElementById("videosGrid").innerHTML = "<p>Episodes unavailable right now.</p>";
    document.getElementById("reviewsGrid").innerHTML = "<p>Reviews unavailable right now.</p>";
  }
})();
