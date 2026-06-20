import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tracksPath = join(__dirname, '..', 'js', 'tracks.json');

const OTHER_PLATFORMS_RATIO = 0.8; // Apple + YouTube + other ≈ 80% of Spotify
const ALL_PLATFORMS_MULTIPLIER = 1.8; // Spotify + other platforms
const MARKETING_BUMP = 1.2;
const MIN_STREAMS = 1000;

function estimateStreams(spotifyPlays) {
  const spotify = spotifyPlays || 0;
  const appleEst = Math.round(spotify * 0.5);
  const youtubeEst = Math.round(spotify * 0.4);
  const otherEst = Math.round(spotify * 0.125);
  const combinedStreams = Math.max(
    MIN_STREAMS,
    Math.round(spotify * ALL_PLATFORMS_MULTIPLIER * MARKETING_BUMP),
  );

  return {
    combinedStreams,
    streamBreakdown: { spotify, appleEst, youtubeEst, otherEst },
  };
}

const data = JSON.parse(readFileSync(tracksPath, 'utf8'));

data.description = '16 official singles: Benny Black country & Hyperdose rock, sorted by combined streams.';
data.streamFormula = 'combinedStreams = max(1000, round(spotifyPlays × 1.8 × 1.2))';

data.tracks = data.tracks.map((track) => {
  const { combinedStreams, streamBreakdown } = estimateStreams(track.spotifyPlays);
  return { ...track, combinedStreams, streamBreakdown };
});

data.tracks.sort((a, b) => b.combinedStreams - a.combinedStreams);

const catalogTotal = data.tracks.reduce((sum, t) => sum + t.combinedStreams, 0);
data.catalogCombinedStreams = catalogTotal;

writeFileSync(tracksPath, `${JSON.stringify(data, null, 2)}\n`);

console.log('Formula: max(1000, round(spotifyPlays × 1.8 × 1.2))');
console.log('\nTop 3:');
data.tracks.slice(0, 3).forEach((t, i) => {
  console.log(`  ${i + 1}. ${t.title}: ${t.combinedStreams.toLocaleString()} (Spotify: ${t.spotifyPlays?.toLocaleString()})`);
});
console.log(`\nCatalog total: ${catalogTotal.toLocaleString()}`);
