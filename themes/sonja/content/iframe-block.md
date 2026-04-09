---
layout: plain
class: iframe-block
---
Durch das Laden des Videos akzeptieren Sie die Datenschutzerklärung von YouTube und stimmen der Datenübertragung zu.

<button class="btn btn-primary" onclick="loadYoutube()">
Video laden
</button>

<p id="fallback" hidden>
Das Video konnte nicht geladen werden. Sie können es <a id="youtube-link" target="_blank">direkt auf YouTube ansehen</a>
</p>

<script>
    let params = new URLSearchParams(document.location.search);

function loadYoutube() {
  window.parent.postMessage({ action: 'enableIframe', youtube: params.get('youtubeId'), iframe: params.get('iframeId') });
    setTimeout(() => {
        document.getElementById('fallback').hidden = false;
        document.getElementById('youtube-link').href = `https://www.youtube.com/watch?v=${params.get('youtubeId')}`;
    }, 1000);
}
</script>