export async function onRequest(context) {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = context.env;
  const url = `https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=5&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}

