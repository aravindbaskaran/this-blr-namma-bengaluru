/**
 * Kannada audio for the phrase, dish, place and festival cards.
 *
 * The site's Kannada strings are a fixed list, so the clips are rendered ahead of
 * time by scripts/build-kannada-audio.py and shipped as small AAC files under
 * audio/kn/. There is nothing to download, nothing to opt into and no model running
 * in the visitor's browser - a tap fetches roughly ten kilobytes and plays.
 *
 * audio/kn/manifest.json maps each Kannada string to its clip. If a string has no
 * clip (someone added a phrase without rebuilding the audio), index.html falls back
 * to whatever voice the device has, as it did before.
 */

const MANIFEST_URL = 'audio/kn/manifest.json';
const CLIP_DIR = 'audio/kn/';

let manifest = null;
let playing = null;
const clips = new Map(); // clip filename -> HTMLAudioElement

/* Must match normalize() in scripts/build-kannada-audio.py so lookups line up. */
function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

const ready = fetch(MANIFEST_URL)
  .then((response) => {
    if (!response.ok) throw new Error(`manifest ${response.status}`);
    return response.json();
  })
  .then((data) => {
    manifest = data;
    console.info(`[kannada-voice] ${Object.keys(data).length} clips available`);
  })
  .catch((e) => {
    /* Not fatal: speakText() just uses the device voice instead. */
    console.warn('[kannada-voice] no clip manifest, falling back to the device voice', e);
  });

function clipFor(text) {
  return manifest ? manifest[normalize(text)] : undefined;
}

function playClip(name) {
  let audio = clips.get(name);
  if (!audio) {
    audio = new Audio(CLIP_DIR + name);
    audio.preload = 'auto';
    clips.set(name, audio);
  }
  if (playing && playing !== audio) {
    playing.pause();
    playing.currentTime = 0;
  }
  playing = audio;
  audio.currentTime = 0;
  const started = audio.play();
  if (started && started.catch) {
    started.catch((e) => console.warn(`[kannada-voice] ${name} would not play`, e));
  }
}

const NammaVoice = {
  /** Does this string have a clip? Waits for the manifest on the first call. */
  async has(text) {
    await ready;
    return !!clipFor(text);
  },

  /**
   * Returns true if a clip has taken the phrase, false to tell the caller to use
   * the device voice. Synchronous on purpose - speakText() needs the answer before
   * it decides - so a tap in the first moment after load can miss and fall back.
   */
  speak(text) {
    if (!text) return false;
    const name = clipFor(text);
    if (!name) return false;
    playClip(name);
    return true;
  },
};

window.NammaVoice = NammaVoice;
export default NammaVoice;
