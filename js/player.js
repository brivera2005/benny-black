const audio = document.getElementById('audio');
const tracklistEl = document.getElementById('tracklist');
const playerTitle = document.getElementById('playerTitle');
const playerSub = document.getElementById('playerSub');
const playerArt = document.getElementById('playerArt');
const btnPlay = document.getElementById('btnPlay');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');
const volumeSlider = document.getElementById('volumeSlider');
const iconPlay = btnPlay.querySelector('.icon-play');
const iconPause = btnPlay.querySelector('.icon-pause');

let tracks = [];
let currentIndex = -1;
let durations = {};

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function setPlayingUI(playing) {
  iconPlay.hidden = playing;
  iconPause.hidden = !playing;
  btnPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

function updateNavButtons() {
  btnPrev.disabled = currentIndex <= 0;
  btnNext.disabled = currentIndex >= tracks.length - 1;
}

function updateProgress() {
  const { currentTime, duration } = audio;
  const pct = duration ? (currentTime / duration) * 100 : 0;
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  progressBar.setAttribute('aria-valuenow', Math.round(pct));
  timeCurrent.textContent = formatTime(currentTime);
  timeTotal.textContent = formatTime(duration);
}

function highlightTrack(index) {
  tracklistEl.querySelectorAll('.tracklist__item').forEach((el, i) => {
    el.classList.toggle('is-active', i === index);
    el.setAttribute('aria-current', i === index ? 'true' : 'false');
  });
}

function loadTrack(index, autoplay = false) {
  if (index < 0 || index >= tracks.length) return;

  currentIndex = index;
  const track = tracks[index];

  audio.src = track.file;
  audio.load();

  playerTitle.textContent = track.title;
  playerSub.textContent = track.feat ? `Benny Black feat. ${track.feat}` : 'Benny Black';
  playerArt.style.background = `linear-gradient(135deg, ${track.color}, ${adjustColor(track.color, -30)})`;

  const letter = track.title.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'BB';
  playerArt.querySelector('.player__art-letter').textContent = letter;

  highlightTrack(index);
  updateNavButtons();
  setPlayingUI(false);

  if (autoplay) {
    audio.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
  }
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function seekTo(clientX) {
  const rect = progressBar.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  if (audio.duration) {
    audio.currentTime = ratio * audio.duration;
  }
}

function buildTracklist() {
  tracklistEl.innerHTML = tracks.map((track, i) => `
    <li class="tracklist__item" data-index="${i}" role="button" tabindex="0" aria-label="Play ${track.title}">
      <span class="tracklist__num">${i + 1}</span>
      <span class="tracklist__dot" style="background:${track.color}"></span>
      <div class="tracklist__info">
        <p class="tracklist__title">${track.title}</p>
        ${track.feat ? `<p class="tracklist__feat">feat. ${track.feat}</p>` : ''}
      </div>
      <span class="tracklist__year">${track.year}</span>
      <span class="tracklist__duration" data-track="${track.id}">—:——</span>
    </li>
  `).join('');

  tracklistEl.querySelectorAll('.tracklist__item').forEach((item) => {
    const index = Number(item.dataset.index);
    item.addEventListener('click', () => {
      if (currentIndex === index && !audio.paused) {
        audio.pause();
        setPlayingUI(false);
      } else if (currentIndex === index) {
        audio.play().then(() => setPlayingUI(true));
      } else {
        loadTrack(index, true);
      }
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
}

async function preloadDurations() {
  for (const track of tracks) {
    const temp = new Audio(track.file);
    temp.preload = 'metadata';
    await new Promise((resolve) => {
      temp.addEventListener('loadedmetadata', () => {
        durations[track.id] = temp.duration;
        const el = tracklistEl.querySelector(`[data-track="${track.id}"]`);
        if (el) el.textContent = formatTime(temp.duration);
        resolve();
      });
      temp.addEventListener('error', resolve);
    });
  }
}

btnPlay.addEventListener('click', () => {
  if (currentIndex === -1 && tracks.length) {
    loadTrack(0, true);
    return;
  }
  if (audio.paused) {
    audio.play().then(() => setPlayingUI(true));
  } else {
    audio.pause();
    setPlayingUI(false);
  }
});

btnPrev.addEventListener('click', () => loadTrack(currentIndex - 1, true));
btnNext.addEventListener('click', () => loadTrack(currentIndex + 1, true));

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);

audio.addEventListener('ended', () => {
  if (currentIndex < tracks.length - 1) {
    loadTrack(currentIndex + 1, true);
  } else {
    setPlayingUI(false);
  }
});

progressBar.addEventListener('click', (e) => seekTo(e.clientX));
progressBar.addEventListener('keydown', (e) => {
  if (!audio.duration) return;
  const step = 5;
  if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
  if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - step);
});

volumeSlider.addEventListener('input', () => {
  audio.volume = Number(volumeSlider.value);
});

audio.volume = Number(volumeSlider.value);

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
  tracks = await res.json();
  buildTracklist();
  preloadDurations();
}

init();
