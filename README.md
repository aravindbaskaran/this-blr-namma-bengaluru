# Namma Bengaluru field guide

Live site: [aravindbaskaran.github.io/this-blr-namma-bengaluru](https://aravindbaskaran.github.io/this-blr-namma-bengaluru/)

This repo is that page. It is a Bengaluru-first field guide, not a generic India itinerary. History, This not that, places and food, Kannada with speaker buttons, Karnataka day trips. The shortlists are **Tourist**, **Local**, and **Both** (the default). Local is the stay list. Tourist is the visitor shortlist. Both is the union.

GitHub Pages serves `docs/` as the site. There is no build step and no CMS. Lists live in JSON. Markup, CSS, and JS stay in their own files. Do not put new lists back into `docs/index.html`.

## How the site is built

- `docs/index.html` - page chrome, sections, Write in forms
- `docs/photos.html` - contributor gallery (the guide only shows a preview)
- `docs/css/` - `tokens.css` (palette and type), `layout.css` (chrome and cards), `stage.css` (saree bands and loader)
- `docs/js/guide.js` - loads the JSON, filters Tourist / Local / Both, map, to-do, forms
- `docs/js/stage-bands.js` and `stage-bands-straight.js` - the cloth bands between sections
- `docs/data/locations.json` - Bengaluru spots (`tourist`, `stay`, `personalPick`, `skipCrowd`, `try`)
- `docs/data/karnataka-places.json` - day trips
- `docs/data/dishes.json`, `phrases.json`, `festivals.json`, `did-you-know.json`, `not-that.json`, `gallery.json`
- `docs/gallery/` - contributor photos. Add the file here, then a row in `gallery.json` (caption, optional `lat`/`lng`). They show on the contributor gallery (`photos.html`), with a short preview on the guide.
- `docs/audio/kn/` - one small clip per Kannada phrase, plus `manifest.json`
- `docs/kannada-voice.js` - looks up a phrase's clip and plays it

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). On the site, **Write in** opens a GitHub issue. A PR that edits `docs/data/*.json` is the other path. After copy changes, run `python3 scripts/check-copy.py`.

## Kannada audio

Next to every Kannada word on the site there is a speaker button. Tapping it plays a
recording of that word.

The recordings are made ahead of time, not in the browser. They live in `docs/audio/kn/`
as small `.m4a` files, one per phrase, about 10 KB each. `manifest.json` in that folder
says which file belongs to which Kannada string, and `docs/kannada-voice.js` looks it up
and plays it. That is all it does.

We do it this way because the list of Kannada phrases is fixed. There are 147 of them and
they rarely change, so there is no reason to make every visitor's phone work them out.
Making the sound once and shipping the files means a visitor downloads about 10 KB when
they tap something, instead of a 38 MB speech model before they hear anything.

If a phrase has no clip, the button falls back to whatever Kannada voice the visitor's
device has. That is usually none, so it will be silent or sound wrong. Not broken, just
not useful. So it is worth making sure every phrase has a clip.

### I want to add a Kannada phrase

Add it to the right file in `docs/data/` like you would any other entry, with its `kn`
field. Commit and push.

That is it. Then render the clip yourself:

- Locally: `python scripts/build-kannada-audio.py` (see below)
- Or, on GitHub: **Actions → Kannada audio → Run workflow**. It is manual because it used to run on every `docs/index.html` push and fail on GitHub-hosted runners (CUDA torchaudio / `libcudart`).

If you open a pull request, make the audio locally (or run that workflow) so every phrase has a clip. If
the check script says one is missing, either wait for a manual run to finish or make it yourself, below.

### Making the audio yourself

This is the same thing the Action does: feed each Kannada string to the speech model,
save what comes back as a small audio file, and record it in the manifest. You only need
to run it by hand if you want the clip straight away, or if the Action is not set up.

The model is gated, which means you need a free Hugging Face account and you have to click
accept on its page once:

1. Sign in at <https://huggingface.co>
2. Click accept at <https://huggingface.co/ai4bharat/indic-parler-tts>, which is instant
3. Make a read token at <https://huggingface.co/settings/tokens>

Then, from the repo root:

```bash
python3 -m venv .venv
.venv/bin/pip install torch numpy git+https://github.com/huggingface/parler-tts.git
.venv/bin/hf auth login          # paste the token when it asks
.venv/bin/python scripts/build-kannada-audio.py
```

It only makes clips that are missing, so adding one phrase takes about a minute. If
nothing is missing it does nothing at all. Add `--force` to redo everything, which takes
around an hour.

The first run downloads the model, which is about 3.5 GB, so give it time. You also need
`afconvert`, which comes with macOS, or `ffmpeg` on Linux.

Other useful flags:

- `--list` prints every phrase and its id without making anything
- `--check` fails if anything is out of order, which is what CI uses. It catches a
  phrase with no clip, a phrase with two clips, a clip nothing points at, and a
  manifest entry whose file is gone
- `--voice Anu` uses a different speaker. The choices are Suresh, Anu, Chetan and Vidya

### Hugging Face token for the Action

The Action needs one secret to work, because the model is gated. Whoever owns the repo
sets it once. Then anyone with write access can run **Kannada audio** from the Actions tab.

Do steps 1 to 3 above to get a token, then add it to the repo under Settings, Secrets and
variables, Actions, with the name `HF_TOKEN`. Or from a terminal:

```bash
gh secret set HF_TOKEN
```

It is a repo secret rather than a person's, so it keeps working when people come and
go.

Nothing breaks if it is never set. The Action still tells you which phrases
have no audio, it just cannot make them. The clips already in the repo play either way.

### Mixing in a real person's voice

Recordings and model clips live side by side. It is per phrase, not all or nothing, so
you can record the ten phrases you care most about and let the model keep handling the
other hundred and thirty seven. The site cannot tell the difference.

Get the list of phrases and their ids:

```bash
.venv/bin/python scripts/build-kannada-audio.py --list
```

An id looks like `bbf48876fb45`. Record a phrase, save it as `bbf48876fb45.wav` in a
folder somewhere, and point the script at that folder:

```bash
.venv/bin/python scripts/build-kannada-audio.py --recordings path/to/that/folder
```

A phrase with a recording uses the recording. Everything else is left exactly as it is,
or made by the model if it has no clip yet. Add more recordings to the folder later and
run it again; only the new ones get picked up.

Each phrase ends up with exactly one clip, whichever source it came from. The Action
never touches a phrase that already has one, so a recording you commit stays put. If two
clips for the same phrase ever do appear, `--check` fails and CI goes red rather than
leaving it to chance which one plays.

A run that is only taking in recordings finishes in under a second and never touches the
model, so you do not need the Hugging Face login or the 3.5 GB download for it.

Adding `--recordings` to `--list` marks which phrases you have already recorded, which is
handy when working through them a few at a time.

### Changing the voice

Edit `MODEL_ID` and `SPEAKERS` at the top of `scripts/build-kannada-audio.py`, then run it
with `--force` to redo every clip.

Before you commit the result, listen to `ಬರ್ರಿ`, `ಕೂಡ್ರಿ` and `ಹೇಗಿದ್ದೀರಾ?` first. Those are
the ones that catch a bad voice. We tried three others before this one and all three
failed on exactly those, because they read words out rather than speak them, and the
colloquial `-ri` ending is where that shows up worst.

### Cache-busting the clips

Clip filenames contain a hash of the audio, so if you change the voice, every filename
changes. That is so a browser cannot keep playing the copy it had
already saved and nobody would ever hear the new voice.

The hash comes from the audio before it is compressed, not from the finished file,
because `afconvert` stamps a timestamp into everything it writes. Hashing the finished
file would rename all 147 clips on every rebuild and leave a fresh copy of each in git
history for no reason.

The script also deletes clips for phrases that no longer exist on the site, so it is safe
to run whenever.

### Credit and licence

The clips are made with [AI4Bharat Indic Parler-TTS](https://huggingface.co/ai4bharat/indic-parler-tts),
speaker Suresh, from IIT Madras. It is trained on 1,806 hours of Indian language speech and
licensed Apache-2.0. Please keep the credit.

Suresh is a real person, but he never said any of these phrases. He recorded hours of other
Kannada sentences for an open research dataset, and the model learned both how Kannada
sounds and what his voice sounds like. Everything in `docs/audio/kn/` is generated, which is
why it can say restaurant names nobody has ever recorded.

## Local preview

From the repo root:

```bash
./scripts/preview.sh
```

Then open http://127.0.0.1:5600/

In Cursor / VS Code, run the **Preview GitHub Pages** task (default build task). Edit files under `docs/` and refresh the browser.

Override the port with `PORT=8080 ./scripts/preview.sh` if 5600 is already in use.

## Share card

`docs/og.png` is the picture WhatsApp, Slack, and Twitter show when someone pastes a link. Both pages point at it. Rebuild it with:

```bash
python3 scripts/make-og.py
```

The script draws the card at 1200x630 in the site palette, with the page's own motifs: the Ilkal temple-tower pallu band, the mango-leaf toran with jasmine and gold beads, and the jasmine-and-marigold mala. Fonts (Baloo Tamma 2 and Baloo 2) are fetched to `/tmp/ogfonts` on first run, so that run needs network. Edit the text or motifs there, not the PNG. Previews stay stale until each app recrawls the URL.

## Who has worked on this repo

The live guide's **About the people behind this** rail is loaded from this GitHub repo: people who have pushed commits, plus people who opened issues (including **Write in**). Named so far, with what they did here:

- Aravind Baskaran (`aravindbaskaran`) - started the repo and the page
- Vinay Karthik Baluguri - Kannada speaker clips in `docs/audio/kn/` and the playback wiring
- Deepika Varadarajan - places, Karnataka day trips, and fact-check on the lists
- Hassan - page layout and the saree bands between sections
- Namita Raddi - spots, food, habbas, and craft rooms (Desi, Varnam, Channapatna)
- Sakshi Gupta (`sakshigupta1996`) - location photos as a full card band, not a 60px thumbnail

If you want a name or a one-line role other than your GitHub login, say so in the PR or issue. That note lives in `PEOPLE_NOTES` in `docs/js/guide.js`.
