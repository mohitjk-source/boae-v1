export async function onRequest(context) {
  const { INSTAGRAM_ACCESS_TOKEN } = context.env;
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=5`;
  const res = await fetch(url);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}
