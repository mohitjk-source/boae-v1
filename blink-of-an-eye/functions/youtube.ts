export async function onRequest(context: EventContext<Env, any, any>) {
  const apiKey = context.env.YOUTUBE_API_KEY;
  const channelId = "UCWuk3YTnT5-9QxeoVF-wUFw"; // your channel ID

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?order=date&type=videos&videoDuration=long&part=snippet&channelId=${channelId}&maxResults=4&key=${apiKey}`
  );
  const data = await res.json();

  const items = (data.items || []).map((item: any) => ({
    id: item.id.videoId,                        // flatten videoId
    title: item.snippet.title,
    thumb: item.snippet.thumbnails.medium.url,  // flatten thumbnail
    publishedAt: item.snippet.publishedAt
  }));

  return Response.json(items); // return array directly
}
