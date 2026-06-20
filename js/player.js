const audio = document.getElementById('audio');
const playerDock = document.getElementById('playerDock');
const playerTitle = document.getElementById('playerTitle');
const playerSub = document.getElementById('playerSub');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');

const ICON_PLAY = '<svg class="track-tile__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5z"/></svg>';
const ICON_PAUSE = '<svg class="track-tile__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>';

let artists = {};
let rawTracks = [];
let tracks = [];
let currentIndex = -1;
let sortMode = 'popular';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatStreams(n) {
  if (!Number.isFinite(n) || n < 1) return '1K';
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    const formatted = v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    const formatted = v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }
  return String(n);
}

function formatStreamsLabel(n) {
  return `${formatStreams(n)} streams`;
}

function appleMusicUrl(track) {
  if (track.appleAlbum && track.appleTrack) {
    return `https://music.apple.com/us/album/${track.appleAlbum}?i=${track.appleTrack}`;
  }
  return null;
}

function buildStreamLinks(track) {
  const artist = track.artist;
  const links = [];
  links.push(`<a href="${artist.spotify}" target="_blank" rel="noopener">Spotify</a>`);
  const appleUrl = appleMusicUrl(track) || artist.apple;
  if (appleUrl) {
    links.push(`<a href="${appleUrl}" target="_blank" rel="noopener">Apple Music</a>`);
  }
  return links.join(' · ');
}

function updateProgress() {
  const { currentTime: t, duration } = audio;
  const pct = duration ? (t / duration) * 100 : 0;
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  progressBar.setAttribute('aria-valuenow', Math.round(pct));
  timeCurrent.textContent = formatTime(t);
  timeTotal.textContent = formatTime(duration);
}

function highlightTile(index, playing) {
  document.querySelectorAll('.track-tile').forEach((el) => {
    const tileIndex = Number(el.dataset.index);
    const isActive = tileIndex === index;
    el.classList.toggle('is-active', isActive);
    el.classList.toggle('is-playing', isActive && playing);
    el.setAttribute('aria-pressed', isActive && playing ? 'true' : 'false');

    const playIcon = el.querySelector('.track-tile__icon--play');
    const pauseIcon = el.querySelector('.track-tile__icon--pause');
    if (playIcon && pauseIcon) {
      const showPause = isActive && playing;
      playIcon.hidden = showPause;
      pauseIcon.hidden = !showPause;
    }
  });

  const activeTrack = tracks[index];
  if (activeTrack) {
    playerDock.dataset.theme = activeTrack.artist.theme;
  }
}

function updateDock(track) {
  playerTitle.textContent = track.title;
  const artistName = track.artist.name;
  const credit = track.feat ? `${artistName} feat. ${track.feat}` : artistName;
  const streams = track.combinedStreams
    ? `<span class="player__streams">${formatStreamsLabel(track.combinedStreams)}</span> · `
    : '';
  playerSub.innerHTML = `${credit} · ${streams}<span class="player__links">${buildStreamLinks(track)}</span>`;
  playerDock.hidden = false;
  playerDock.dataset.theme = track.artist.theme;
}

async function resolveAudioSrc(track) {
  if (track.file) {
    const probe = new Audio();
    probe.preload = 'metadata';
    const loaded = await new Promise((resolve) => {
      probe.addEventListener('loadedmetadata', () => resolve(true), { once: true });
      probe.addEventListener('error', () => resolve(false), { once: true });
      probe.src = track.file;
    });
    if (loaded) return track.file;
  }
  return track.previewUrl;
}

async function loadTrack(index, autoplay = false) {
  if (index < 0 || index >= tracks.length) return;

  currentIndex = index;
  const track = tracks[index];
  const src = await resolveAudioSrc(track);

  if (!src) return;

  audio.src = src;
  audio.load();
  updateDock(track);
  highlightTile(index, false);
  updateProgress();

  if (autoplay) {
    try {
      await audio.play();
      highlightTile(index, true);
    } catch {
      highlightTile(index, false);
    }
  }
}

function toggleTrack(index) {
  if (currentIndex === index && !audio.paused) {
    audio.pause();
    highlightTile(index, false);
    return;
  }

  if (currentIndex === index && audio.paused) {
    audio.play()
      .then(() => highlightTile(index, true))
      .catch(() => highlightTile(index, false));
    return;
  }

  loadTrack(index, true);
}

function seekTo(clientX) {
  const rect = progressBar.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  if (audio.duration) {
    audio.currentTime = ratio * audio.duration;
  }
}

function buildTrackTile(track, index) {
  const theme = track.artist.theme;
  const genre = track.artist.genre;

  return `
    <button
      type="button"
      class="track-tile track-tile--${theme}"
      data-index="${index}"
      role="listitem"
      aria-label="Play ${track.title} by ${track.artist.name}"
      aria-pressed="false"
    >
      <div class="track-tile__art">
        <img
          class="track-tile__img"
          src="${track.artwork}"
          alt="${track.title} cover art"
          width="600"
          height="600"
          loading="${index < 8 ? 'eager' : 'lazy'}"
          decoding="async"
        >
        <div class="track-tile__overlay">
          <span class="track-tile__btn">
            <span class="track-tile__icon--play">${ICON_PLAY}</span>
            <span class="track-tile__icon--pause" hidden>${ICON_PAUSE}</span>
          </span>
        </div>
        <span class="track-tile__badge">${genre}</span>
        <div class="track-tile__glow" aria-hidden="true"></div>
      </div>
      <div class="track-tile__meta">
        <p class="track-tile__title">${track.title}</p>
        <p class="track-tile__artist">${track.artist.name}</p>
        ${track.feat ? `<p class="track-tile__feat">feat. ${track.feat}</p>` : ''}
        <p class="track-tile__year">${track.year}${track.combinedStreams ? ` · <span class="track-tile__streams">${formatStreamsLabel(track.combinedStreams)}</span>` : ''}</p>
      </div>
    </button>
  `;
}

function trackYear(track) {
  return parseInt(track.year, 10) || 0;
}

function sortTracks(mode) {
  sortMode = mode;
  const playingId = currentIndex >= 0 ? tracks[currentIndex]?.id : null;
  const wasPlaying = Boolean(playingId && !audio.paused);

  if (mode === 'date') {
    tracks = [...rawTracks].sort((a, b) => {
      const yearDiff = trackYear(b) - trackYear(a);
      if (yearDiff !== 0) return yearDiff;
      return b._originalIndex - a._originalIndex;
    });
  } else {
    tracks = [...rawTracks].sort(
      (a, b) => (b.combinedStreams ?? 0) - (a.combinedStreams ?? 0),
    );
  }

  buildGrid();

  if (playingId) {
    const newIndex = tracks.findIndex((track) => track.id === playingId);
    if (newIndex >= 0) {
      currentIndex = newIndex;
      highlightTile(newIndex, wasPlaying);
    }
  }

  updateSortToggleUI();
}

function updateSortToggleUI() {
  document.querySelectorAll('.sort-toggle__btn').forEach((btn) => {
    const active = btn.dataset.sort === sortMode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function initSortToggle() {
  const toggle = document.querySelector('.sort-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.sort-toggle__btn');
    if (!btn || btn.dataset.sort === sortMode) return;
    sortTracks(btn.dataset.sort);
  });
}

function buildGrid() {
  const container = document.getElementById('musicGrid');

  container.innerHTML = tracks.map((track, index) => buildTrackTile(track, index)).join('');

  container.querySelectorAll('.track-tile').forEach((tile) => {
    const index = Number(tile.dataset.index);
    tile.addEventListener('click', () => toggleTrack(index));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTrack(index);
      }
    });
  });
}

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);

audio.addEventListener('ended', () => {
  highlightTile(currentIndex, false);
  if (currentIndex < tracks.length - 1) {
    loadTrack(currentIndex + 1, true);
  }
});

audio.addEventListener('pause', () => {
  if (currentIndex >= 0) highlightTile(currentIndex, false);
});

audio.addEventListener('play', () => {
  if (currentIndex >= 0) highlightTile(currentIndex, true);
});

progressBar.addEventListener('click', (e) => seekTo(e.clientX));
progressBar.addEventListener('keydown', (e) => {
  if (!audio.duration) return;
  const step = 5;
  if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
  if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - step);
});

audio.volume = 0.85;

document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');

navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('is-open', !open);
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
  });
});

async function init() {
  const res = await fetch('js/tracks.json');
  const data = await res.json();
  artists = data.artists;
  rawTracks = data.tracks.map((track, index) => ({
    ...track,
    artist: artists[track.artistId],
    _originalIndex: index,
  }));

  const catalogTotal = data.catalogCombinedStreams
    ?? rawTracks.reduce((sum, t) => sum + (t.combinedStreams ?? 0), 0);
  const heroStat = document.getElementById('catalogStreams');
  if (heroStat && catalogTotal) {
    heroStat.textContent = `${formatStreams(catalogTotal)}+ combined streams`;
  }

  initSortToggle();
  sortTracks('popular');
}

init();
