#!/usr/bin/env python3
"""Render every Kannada string on the site to a small audio clip, once.

The guide's Kannada phrases are a fixed list, so there is no reason to make each
visitor's browser synthesise them. This renders them ahead of time into
docs/audio/kn/ plus a manifest the page looks up at runtime.

Voice: AI4Bharat Indic Parler-TTS (https://huggingface.co/ai4bharat/indic-parler-tts),
Apache-2.0, trained on 1,806 hours of Indic speech. Kannada is one of its officially
supported languages and one where a delivery instruction is honoured, so the clips
are asked for in a conversational tone rather than a narration one. That is the
difference you can hear on the colloquial "-ri" endings that the alternatives read
stiffly.

The repository is gated: accept its terms once on Hugging Face and log in with
`hf auth login` before the first run. Nothing is needed after the weights cache.

Human recordings still beat it. Drop WAVs into a folder and pass --recordings and
they win over the model, phrase by phrase; the site cannot tell the difference.

Maintainers only; visitors never run this. The model is about 3.5 GB and generation
is slow (seconds per phrase), so a full rebuild takes a while. That cost is paid once
here rather than by every visitor.

    python3 -m venv .venv
    .venv/bin/pip install torch numpy git+https://github.com/huggingface/parler-tts.git
    .venv/bin/hf auth login
    .venv/bin/python scripts/build-kannada-audio.py
"""

import argparse
import glob
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'docs', 'data')
INDEX = os.path.join(ROOT, 'docs', 'index.html')
OUT_DIR = os.path.join(ROOT, 'docs', 'audio', 'kn')
MANIFEST = os.path.join(OUT_DIR, 'manifest.json')
MODEL_ID = 'ai4bharat/indic-parler-tts'
SAMPLE_RATE = 44100
KANNADA = re.compile(r'[ಀ-೿]')

# AI4Bharat's recommended Kannada speakers; they rate Suresh and Anu highest.
SPEAKERS = ('Suresh', 'Anu', 'Chetan', 'Vidya')
DELIVERY = ('{speaker} speaks in a casual, conversational tone, as if talking to a friend '
            'in everyday speech rather than reading aloud. The delivery is natural and '
            'expressive at a moderate pace. Very high quality recording, no background noise.')


def normalize(text):
    """Must match normalize() in docs/kannada-voice.js so lookups line up."""
    return re.sub(r'\s+', ' ', text).strip()


def prepare_for_voice(text):
    """The written form is not always speakable. Only affects what the model hears;
    the manifest is still keyed by the string as it appears on the site."""
    text = text.replace('‌', '').replace('‍', '')  # invisible joiners, no sound
    text = text.replace('/', ',')                            # "ಅಣ್ಣ / ಅಕ್ಕ" -> a pause
    return re.sub(r'\s+', ' ', text).strip()


def collect():
    """Every Kannada string the page can ask to speak, in a stable order."""
    found = {}

    def note(text, source):
        text = normalize(text)
        if text and KANNADA.search(text):
            found.setdefault(text, source)

    def walk(node, source):
        if isinstance(node, dict):
            for key, value in node.items():
                if key == 'kn' and isinstance(value, str):
                    note(value, source)
                else:
                    walk(value, source)
        elif isinstance(node, list):
            for value in node:
                walk(value, source)

    for path in sorted(glob.glob(os.path.join(DATA_DIR, '*.json'))):
        with open(path, encoding='utf-8') as fh:
            walk(json.load(fh), os.path.basename(path))

    # A handful of phrases are written straight into the page rather than the data.
    with open(INDEX, encoding='utf-8') as fh:
        for text in re.findall(r"speakText\('([^']+)'\)", fh.read()):
            note(text.replace("\\'", "'"), 'index.html')

    return found


def phrase_id(text):
    """Stable name for a phrase, independent of which voice rendered it. Used by
    --list and by --recordings so a human can name their files predictably."""
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:12]


def recording_for(directory, phrase):
    """A human recording for this phrase, if one has been dropped in."""
    if not directory:
        return None
    candidate = os.path.join(directory, phrase + '.wav')
    return candidate if os.path.exists(candidate) else None


def clip_name(phrase, wav_path, kbps):
    """Clip filenames carry a hash of the audio, so re-rendering with a different
    voice produces a different URL. Without that, browsers and CDNs go on serving the
    copy they already cached and nobody hears the new voice.

    Hashed from the WAV rather than the encoded file on purpose: afconvert stamps a
    timestamp into its output, so encoding the same audio twice gives different bytes.
    Hashing that would rename every clip on every rebuild and pile up copies in git
    history for no reason."""
    with open(wav_path, 'rb') as fh:
        digest = hashlib.sha1(fh.read() + str(kbps).encode()).hexdigest()[:8]
    return f'{phrase}-{digest}.m4a'


def load_voice(speaker):
    """Return a render function. The model is gated, so the first run needs
    `hf auth login`; afterwards the weights are cached locally."""
    import numpy as np
    import torch
    from parler_tts import ParlerTTSConfig, ParlerTTSForConditionalGeneration
    from transformers import AutoConfig, AutoTokenizer, set_seed

    # The package ships the config class but never registers it with AutoConfig.
    try:
        AutoConfig.register('parler_tts', ParlerTTSConfig)
    except ValueError:
        pass  # already registered

    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID).to(device).eval()
    prompt_tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, config=model.config)
    style_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    style = style_tokenizer(DELIVERY.format(speaker=speaker), return_tensors='pt').to(device)
    print(f'  loaded on {device}')

    def render(text):
        set_seed(0)  # sampled decoding; fix it so rebuilds are reproducible
        prompt = prompt_tokenizer(prepare_for_voice(text), return_tensors='pt').to(device)
        with torch.no_grad():
            generated = model.generate(
                input_ids=style.input_ids, attention_mask=style.attention_mask,
                prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask)
        audio = generated.cpu().numpy().squeeze().astype(np.float32)
        # Levels vary a lot between phrases; even them out so one clip is not
        # noticeably quieter than the next.
        peak = float(np.abs(audio).max()) if audio.size else 0.0
        if peak > 0.01:
            audio = audio * (0.89 / peak)
        return audio

    return render


def find_encoder():
    for tool in ('afconvert', 'ffmpeg'):
        if shutil.which(tool):
            return tool
    sys.exit('Need afconvert (macOS) or ffmpeg on PATH to encode the clips.')


def encode(encoder, wav_path, out_path, kbps):
    if encoder == 'afconvert':
        cmd = ['afconvert', '-f', 'm4af', '-d', 'aac', '-b', str(kbps * 1000),
               '-c', '1', wav_path, out_path]
    else:
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path,
               '-c:a', 'aac', '-b:a', f'{kbps}k', '-ac', '1', out_path]
    subprocess.run(cmd, check=True, capture_output=True)


def write_wav(samples, rate, path):
    import numpy as np
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype('<i2')
    with wave.open(path, 'wb') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(pcm.tobytes())


def finish(manifest, new_count, suspect):
    """Write the manifest and drop clips nothing points at any more."""
    with open(MANIFEST, 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=0, sort_keys=True)

    keep = set(manifest.values()) | {'manifest.json'}
    for stale in sorted(os.listdir(OUT_DIR)):
        if stale not in keep:
            os.remove(os.path.join(OUT_DIR, stale))
            print(f'  removed stale clip {stale}')

    on_disk = sum(os.path.getsize(os.path.join(OUT_DIR, n)) for n in manifest.values())
    print(f'{len(manifest)} clips ({new_count} new), {on_disk/1e6:.2f} MB total, '
          f'manifest at {os.path.relpath(MANIFEST, ROOT)}')
    if suspect:
        print(f'{len(suspect)} clip(s) worth listening to before publishing:')
        for text in suspect:
            print(f'  {text}  ->  {manifest[text]}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice', choices=SPEAKERS, default='Suresh',
                        help='AI4Bharat Kannada speaker (default Suresh)')
    parser.add_argument('--kbps', type=int, default=32, help='AAC bitrate (default 32)')
    parser.add_argument('--recordings', metavar='DIR',
                        help='prefer human-recorded WAVs from DIR, named <clip name>.wav')
    parser.add_argument('--list', action='store_true',
                        help='print the phrases and their clip names, render nothing')
    parser.add_argument('--force', action='store_true',
                        help='re-render every clip, not just the ones that are missing')
    parser.add_argument('--check', action='store_true',
                        help='exit non-zero if any phrase lacks a clip; renders nothing')
    args = parser.parse_args()

    phrases = collect()
    print(f'{len(phrases)} distinct Kannada strings across the site')

    if args.list:
        for number, (text, source) in enumerate(phrases.items(), 1):
            mark = ''
            if args.recordings:
                mark = 'recorded ' if recording_for(args.recordings, phrase_id(text)) else '-------- '
            print(f'{number:3}. {phrase_id(text)}  {mark}{source:24} {text}')
        return

    # Reuse what is already rendered. Adding one phrase should cost one clip, not 147.
    existing = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding='utf-8') as fh:
            existing = json.load(fh)
    # A phrase with a recording waiting is never reused: re-encoding a WAV is
    # instant and costs no model, and otherwise a recording added later would be
    # silently ignored in favour of the clip the model already made.
    reusable = {} if args.force else {
        text: name for text, name in existing.items()
        if text in phrases
        and os.path.exists(os.path.join(OUT_DIR, name))
        and not recording_for(args.recordings, phrase_id(text))
    }
    todo = [text for text in phrases if text not in reusable]

    if args.check:
        problems = []

        for text in todo:
            problems.append(f'no clip: {phrase_id(text)}  {text}')

        on_disk = {n for n in os.listdir(OUT_DIR) if n.endswith('.m4a')}

        # One phrase, one clip. Two files sharing a phrase id means a recorded clip
        # and a rendered one both survived, and which of them plays is down to
        # whatever the manifest happens to point at.
        by_phrase = {}
        for name in sorted(on_disk):
            by_phrase.setdefault(name.split('-')[0], []).append(name)
        for pid, names in sorted(by_phrase.items()):
            if len(names) > 1:
                problems.append(f'{len(names)} clips for one phrase {pid}: {", ".join(names)}')

        for name in sorted(on_disk - set(existing.values())):
            problems.append(f'clip no phrase points at: {name}')

        for text, name in sorted(existing.items()):
            if name not in on_disk:
                problems.append(f'manifest points at a missing file: {name}  ({text})')

        if problems:
            print(f'{len(problems)} problem(s):')
            for problem in problems:
                print(f'   {problem}')
            sys.exit(1)

        print(f'{len(phrases)} phrases, {len(on_disk)} clips, one each, all accounted for')
        return

    print(f'{len(reusable)} already rendered, {len(todo)} to render')
    if not todo:
        # Still rewrite: a phrase may have been removed rather than added, and its
        # clip and manifest entry should go with it.
        finish(reusable, 0, [])
        return

    import numpy as np

    encoder = find_encoder()
    os.makedirs(OUT_DIR, exist_ok=True)

    # Loaded only if something actually needs the model, so a run that is purely
    # re-encoding recordings needs no Hugging Face access and no 3.5 GB download.
    render = None

    manifest = dict(reusable)
    suspect = []
    total_bytes = 0
    tmp_wav = os.path.join(OUT_DIR, '.tmp.wav')

    for index, text in enumerate(todo, 1):
        phrase = phrase_id(text)

        recorded = recording_for(args.recordings, phrase)

        if recorded:
            shutil.copyfile(recorded, tmp_wav)
            with wave.open(tmp_wav) as handle:
                seconds = handle.getnframes() / handle.getframerate()
            peak, origin = 1.0, 'recorded'
        else:
            if render is None:
                print(f'voice: AI4Bharat Indic Parler-TTS, speaker {args.voice}, '
                      f'{SAMPLE_RATE} Hz')
                render = load_voice(args.voice)
            audio = render(text)
            peak = float(np.abs(audio).max()) if audio.size else 0.0
            seconds = audio.size / SAMPLE_RATE
            write_wav(audio, SAMPLE_RATE, tmp_wav)
            origin = 'rendered'

        tmp_clip = os.path.join(OUT_DIR, '.tmp.m4a')
        if os.path.exists(tmp_clip):
            os.remove(tmp_clip)
        encode(encoder, tmp_wav, tmp_clip, args.kbps)
        name = clip_name(phrase, tmp_wav, args.kbps)
        out_path = os.path.join(OUT_DIR, name)
        os.replace(tmp_clip, out_path)
        size = os.path.getsize(out_path)
        total_bytes += size
        manifest[text] = name

        flag = ''
        if peak < 0.02 or seconds < 0.2:
            flag = '  <-- CHECK: near silence or too short'
            suspect.append(text)
        print(f'  [{index:3}/{len(todo)}] {origin} {seconds:5.2f}s {size/1024:6.1f}KB '
              f'peak={peak:.2f} {text}{flag}')

    if os.path.exists(tmp_wav):
        os.remove(tmp_wav)

    finish(manifest, len(todo), suspect)


if __name__ == '__main__':
    main()
