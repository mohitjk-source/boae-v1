export async function onRequest(context) {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = context.env;
  const url = `https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&channelId=@soulwithoutjhol&maxResults=5&key=AIzaSyCt_Wx6OtPLGiglVMsBurTUaauJokR_Nt0`;
  const res = await fetch(url);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}

