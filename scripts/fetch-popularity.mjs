const tracks = [
  { id: 'downtown', title: 'Downtown', artist: 'Benny Black', appleTrack: 1625367144, appleAlbum: 1625367143 },
  { id: 'whos-comin-with-me', title: "Who's Comin' with Me?", artist: 'Benny Black', appleTrack: 1650634029, appleAlbum: 1650634028 },
  { id: 'youre-my-summertime', title: "You're My Summertime", artist: 'Benny Black', appleTrack: 1698247491, appleAlbum: 1698247490 },
  { id: 'my-rearview-mirror', title: 'My Rearview Mirror (Is My Backyard)', artist: 'Benny Black', appleTrack: 1705084372, appleAlbum: 1705084371 },
  { id: 'red-revival', title: 'Red Revival', artist: 'Benny Black', appleTrack: 1834245786, appleAlbum: 1834245785 },
  { id: 'tacklebox', title: 'Tacklebox', artist: 'Benny Black', appleTrack: 1869811474, appleAlbum: 1869811473 },
  { id: 'take-control', title: 'Take Control', artist: 'Hyperdose', appleTrack: 984671591, appleAlbum: 984671410 },
  { id: 'throw-it-down', title: 'Throw It Down', artist: 'Hyperdose', appleTrack: 1110838651, appleAlbum: 1110838518 },
  { id: 'the-hunted', title: 'The Hunted', artist: 'Hyperdose', appleTrack: 1110838723, appleAlbum: 1110838518 },
  { id: 'coming-for-you', title: 'Coming For You', artist: 'Hyperdose', appleTrack: 1110838724, appleAlbum: 1110838518 },
  { id: 'impact', title: 'Impact', artist: 'Hyperdose', appleTrack: 1110838725, appleAlbum: 1110838518 },
  { id: 'disaster', title: 'Disaster (Roll with the Punches)', artist: 'Hyperdose', appleTrack: 1351048942, appleAlbum: 1351048938 },
  { id: 'phantom', title: 'Phantom', artist: 'Hyperdose', appleTrack: 1351048945, appleAlbum: 1351048938 },
  { id: 'undeniable', title: 'Undeniable', artist: 'Hyperdose', appleTrack: 1351048946, appleAlbum: 1351048938 },
  { id: 'see-the-light', title: 'See the Light', artist: 'Hyperdose', appleTrack: 1351048947, appleAlbum: 1351048938 },
  { id: 'vile', title: 'Vile', artist: 'Hyperdose', appleTrack: 1351048948, appleAlbum: 1351048938 },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function appleUrl(track) {
  return `https://music.apple.com/us/album/${track.appleAlbum}?i=${track.appleTrack}`;
}

async function songlinkSpotifyUrl(appleMusicUrl) {
  const res = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(appleMusicUrl)}`);
  const text = await res.text();
  if (!res.ok) {
    return { error: `${res.status} ${text.slice(0, 120)}` };
  }
  const data = JSON.parse(text);
  return { url: data.linksByPlatform?.spotify?.url ?? null, raw: data };
}

async function itunesLookup(trackId) {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song`);
  const data = await res.json();
  return data.results?.[0] ?? null;
}

async function searchSpotifyWeb(title, artist) {
  const q = encodeURIComponent(`${title} ${artist}`);
  const res = await fetch(`https://open.spotify.com/search/${q}/tracks`, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
  });
  const html = await res.text();
  const trackIds = [...new Set([...html.matchAll(/\/track\/([a-zA-Z0-9]{22})/g)].map((m) => m[1]))];
  return trackIds.slice(0, 5);
}

async function scrapeTrackPage(trackId) {
  const url = `https://open.spotify.com/track/${trackId}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/s);
  if (nextDataMatch) {
    const json = JSON.parse(nextDataMatch[1]);
    const entity = json?.props?.pageProps?.state?.data?.entity;
    if (entity) {
      return {
        popularity: entity.popularity ?? null,
        name: entity.name ?? null,
        artists: entity.artists?.items?.map((a) => a.profile.name) ?? [],
        id: trackId,
        url,
      };
    }
  }

  const pop = html.match(/"popularity":(\d+)/);
  const name = html.match(/"name":"([^"]+)"/);
  return {
    popularity: pop ? Number(pop[1]) : null,
    name: name?.[1] ?? null,
    artists: [],
    id: trackId,
    url,
  };
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchesTrack(page, track) {
  if (!page.name) return false;
  const titleOk = normalize(page.name).includes(normalize(track.title).slice(0, 8))
    || normalize(track.title).includes(normalize(page.name).slice(0, 8));
  const artistOk = page.artists.length === 0
    || page.artists.some((a) => normalize(a).includes(normalize(track.artist)));
  return titleOk && artistOk;
}

async function main() {
  const results = [];

  for (const track of tracks) {
    const entry = { id: track.id, title: track.title, artist: track.artist };
    const apple = appleUrl(track);

    const link = await songlinkSpotifyUrl(apple);
    entry.songlink = link;

    const itunes = await itunesLookup(track.appleTrack);
    entry.itunesTrackName = itunes?.trackName;
    entry.itunesArtist = itunes?.artistName;

    let spotifyInfo = null;

    if (link.url) {
      const id = link.url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
      if (id) spotifyInfo = await scrapeTrackPage(id);
      entry.method = 'songlink';
    }

    if (!spotifyInfo?.popularity) {
      const ids = await searchSpotifyWeb(track.title, track.artist);
      for (const id of ids) {
        const page = await scrapeTrackPage(id);
        if (matchesTrack(page, track) && page.popularity != null) {
          spotifyInfo = page;
          entry.method = 'spotify_search_scrape';
          break;
        }
      }
    }

    entry.popularity = spotifyInfo?.popularity ?? null;
    entry.spotifyId = spotifyInfo?.id ?? null;
    entry.spotifyUrl = spotifyInfo?.url ?? link.url ?? null;
    entry.spotifyName = spotifyInfo?.name ?? null;

    results.push(entry);
    console.error(`${track.title}: pop=${entry.popularity} method=${entry.method ?? 'none'}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  results.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
