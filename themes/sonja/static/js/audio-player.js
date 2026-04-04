/* audio-player.js
   Connects custom audio controls (from the shortcode) to Howler.js


      /* audio-player.js
         Connects custom audio controls (from the shortcode) to Howler.js

         Expected markup shape (shortcode):
         <div class="audio-controls" data-audio-id="audio-123" data-src="/path/to/file.mp3">
           ... buttons and inputs ...
         </div>

         This script will use Howler.js (Howl) to play audio. If Howler is not loaded it will
         log a warning and leave the markup inert (the <noscript> native audio fallback will work).
      */

(function () {
    'use strict';

    function formatTime(secs) {
        if (!isFinite(secs) || secs < 0) return '0:00';
        const m = Math.floor(secs / 60) || 0;
        const s = Math.floor(secs % 60) || 0;
        return m + ':' + (s < 10 ? '0' + s : s);
    }

    function findSourceUrl(controls) {
        const audioId = controls.getAttribute('data-audio-id');
        if (controls && controls.dataset && controls.dataset.src) return controls.dataset.src;
        console.warn('No audio source found for', audioId);
    }

    class Player {
        uiTimer = null;
        playing = false;

        constructor(controls) {
            this._controls = controls;
            this._playBtn = controls.querySelector('[data-action="play"]') || controls.querySelector('.audio-play');
            this._seekSlider = controls.querySelector('[data-action="seek"]') || controls.querySelector('.seek-slider');
            this._volumeSlider = controls.querySelector('[data-action="volume"]') || controls.querySelector('.volume-slider');
            this._timeCurrent = controls.querySelector('.time.current') || controls.querySelector('.time') || controls.querySelector('.time-display');

            if (typeof Howl === 'undefined') {
                throw 'Howler.js not found. Skipping audio initialization for' + audioId;
            }

            this.#setupHowl();
            this.#setupDomElements();
        }

        isPlaying() {
            return this.playing;
        }

        play() {
            this.#stopOtherPlayers();
            this.howl.play();
            this.playing = true;
        }

        pause() {
            this.howl.pause();
            this.#updateDomElements();
            this.playing = false;
        }

        togglePlay() {
            if (this.isPlaying()) {
                this.pause();
            } else {
                this.play();
            }
        }

        #setupHowl() {
            if (this.howl) return;
            const src = findSourceUrl(this._controls);
            this.howl = new Howl({
                src: [src], html5: true, preload: true, // better change to false? But then loading time animation needed.
                onload: () => {
                    this._seekSlider.max = Math.max(1, this.howl.duration());
                    this.#setPlaybackPosFromSlider();
                    this.#updateDomElements();
                },
            });

            // Howl events -> UI
            this.howl.on('play', () => {
                this.#updateDomElements();
            });
            this.howl.on('pause', () => this.#updateDomElements());
            this.howl.on('stop', () => {
                this.playing = false;
                this.#updateDomElements();
            });
            this.howl.on('end', () => {
                this.playing = false;
                this.#updateDomElements();
            });
        }

        #setupDomElements() {
            // Play / Pause (toggle)
            this._playBtn.addEventListener('click', () => this.togglePlay());

            this._seekSlider.addEventListener('input', () => this.#onSliderChange());
            this._seekSlider.addEventListener('change', () => this.#onSliderChange());
            this._seekSlider.addEventListener("mousedown", () => {
                if (this.isPlaying()) {
                    this.howl.pause();
                }
            })
            this._seekSlider.addEventListener("mouseup", () => {
                if (this.isPlaying()) {
                    this.howl.play();
                }
            });

            this._volumeSlider.addEventListener('input', e => {
                const v = parseFloat(e.target.value);
                if (isFinite(v)) this.howl.volume(v);
            });
        }

        #updateDomElements() {
            this.#updateTimestampAndSlider();
            this.#updatePlayButton();
            if (this.isPlaying()) {
                this.#startUiUpdater();
            } else {
                this.#stopUiUpdater();
            }
        }

        #updateTimestampAndSlider() {
            try {
                if (this.isPlaying()) {
                    const pos = this.howl.seek() || 0;
                    this._timeCurrent.textContent = formatTime(pos);
                    this._seekSlider.value = pos;
                } else if (this._seekSlider.value !== "0") {
                    this._timeCurrent.textContent = formatTime(this._seekSlider.value);
                } else {
                    this._timeCurrent.textContent = formatTime(this.howl.duration())
                    this._seekSlider.value = 0;
                }
            } catch (e) {
                console.log(e)
                // ignore if howl not ready
            }
        }

        #startUiUpdater() {
            if (!this.uiTimer) this.uiTimer = setInterval(() => this.#updateTimestampAndSlider(), 250);
        }

        #stopUiUpdater() {
            if (this.uiTimer) {
                clearInterval(this.uiTimer);
                this.uiTimer = null;
            }
        }

        #updatePlayButton() {
            if (this.isPlaying()) {
                this._controls.classList.add('is-playing');
                this._playBtn.setAttribute('aria-pressed', 'true');
            } else {
                this._controls.classList.remove('is-playing');
                this._playBtn.setAttribute('aria-pressed', 'false');
            }
        }

        #onSliderChange() {
            this.#setPlaybackPosFromSlider();
            this.#updateTimestampAndSlider();
        }

        #stopOtherPlayers() {
            const all = document.querySelectorAll('.audio-controls');
            [...all].filter(el => el.player !== this).forEach(el => el.player.pause());
        }

        #setPlaybackPosFromSlider() {
            const duration = this.howl.duration() || 0;
            let pos = parseFloat(this._seekSlider.value);
            pos = Math.max(0, Math.min(duration, pos));
            try {
                this.howl.seek(pos);
            } catch (e) {
                console.log(e)
            }
        }
    }


    function initAll() {
        document.querySelectorAll('.audio-controls[data-audio-id]').forEach(c => c.player = new Player(c));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
})();

