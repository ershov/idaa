//// @script Scroll snaps to the post beginning. Hotkey navigation. Video Speed.

let QS = (sel, e = null) => (e === undefined) ? undefined : (e || document).querySelector(sel);
let QA = (sel, e = null) => (e === undefined) ? undefined : (e || document).querySelectorAll(sel);
let PageOffset = e => [...(function*(e){ yield e; while (e.offsetParent) { yield e = e.offsetParent; }})(e)].reduce((a,v) => a + v.offsetTop, 0);
let WindowOffset = e => PageOffset(e) - window.scrollY;
let NextOne = () => [...QA("article")].find(e => WindowOffset(e) > 53);
let PrevOne = () => [...QA("article")].find(e => WindowOffset(e) > -50).previousElementSibling;
let CurrOne = () => [...QA("article")].find(e => {let off = WindowOffset(e); return off > -300 && off < 150 });
let ScrollTo = e => window.scroll(0, PageOffset(e) - 53);
let ClickInCurr = sel => { let e = QS(sel, CurrOne()); e?.click(); return e; };

let Cleanup = () => [...QS("article")?.parentElement.children].filter(e => e.nodeName != "ARTICLE").forEach(e => e.style.display="none");

let Fixed = (n, prec) => n.toFixed(prec).replace(/\.([1-9]*)(0+)$/, ".$1").replace(/\.$/, "");
let Fill = (n, width) => (new Array(width).fill('0').join("") + n).substr(-width);
let AlignRateUp = n => Math.round(n*4)/4;
let AlignRateDown = n => Math.round(n*100)/100;
let AlignRate = n => (n > 1 ? AlignRateUp : AlignRateDown)(n);

function Badge(html) {
  let template = document.createElement("div");
  template.style = `position: fixed; z-index: 1000; background-color: #202040; color: #fff; top: 30%; left: 30%;`;
  let Close = ev=>{ev.preventDefault(); ev.cancelBubble=true; template.remove();};
  window.addEventListener("keydown", Close, {once: true, capture: true});
  template.innerHTML = html.trim();
  document.body.insertAdjacentElement("afterBegin", template);
}
function VideoStatus(container, video) {
  if (!container || !video) return;
  window?.video_status?.remove();
  let template = document.createElement("template");
  template.innerHTML =
    `<div id=video_status style="position:fixed;z-index:1000;left:0;bottom:0;width:100%;color:black;padding:0;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;font-weight:bold;">`+
      `<div style="position:absolute;bottom:-2px;width:100%;height:1em;background-color:#AAA;white-space: pre;"></div>`+
      `<div style="position:absolute;bottom:-2px;width:${video.currentTime*100/video.duration}%;height:1em;background-color:#F66;"></div>`+
      `<div style="potision:absolute;text-align: center;white-space: pre;">${SecToTime(video.currentTime)} / ${SecToTime(video.duration)}      speed: ${video.playbackRate}x</div>`+
    `</div>`;
  let div = template.content.children[0];
  setTimeout(()=>div.remove(), 2500);
  container.append(div);
}
let GetVideo = () => {
  let [container, video] = [CurrOne(), QS('video', CurrOne())];
  if (!container || !video) [container, video] = [QS("[role=dialog]"), QS("[role=dialog] video")];
  return !container || !video ? [] : [container, video];
};
let VideoPlaybackRate = cb => {
  let [container, video] = GetVideo();
  if (!container || !video) return;
  let rate = video.playbackRate;
  rate = AlignRate(cb(rate));
  console.log('video rate', video.playbackRate = rate);
  VideoStatus(container, video);
};
let SecToTime = sec =>
  "" + Math.floor(sec / 3600) +
  ":" + ("0"+Math.floor((sec % 3600) / 60)).substr(-2) +
  ":" + ("0"+Math.floor(sec % 60)).substr(-2);
let VideoPlayPos = cb => {
  let [container, video] = GetVideo();
  if (!container || !video) return;
  let pos = cb(video.currentTime, video.duration);
  pos = Math.min(Math.max(pos, 0), video.duration);
  console.log('video time', video.currentTime, video.duration, '->', pos);
  video.currentTime = pos;
  VideoStatus(container, video);
};

document.addEventListener("keydown", ev => {
  if (["INPUT", "LABEL", "SELECT", "TEXTAREA", "BUTTON", "FIELDSET", "LEGEND", "DATALIST", "OUTPUT", "OPTION", "OPTGROUP", ].includes(document.activeElement.tagName)) return;
  if (ev.code === "PageDown" || (ev.code === "Space" && !ev.shiftKey)) {
    // Scroll to the next post and align it to the top of the page
    ScrollTo(NextOne());
    ev.preventDefault();
		[...QA("article button")].forEach(e => e.innerHTML === "more" && e.click());
    document.body.focus();
  } else if (ev.code === "PageUp" || ev.code === "KeyB" || (ev.shiftKey && ev.code === "Space")) {
    // Scroll to the prev post and align it to the top of the page
    ScrollTo(PrevOne());
    ev.preventDefault();
    document.body.focus();
  } else if (ev.code === "ArrowLeft") {
    // Scroll right to the next image in the post
    ClickInCurr(".coreSpriteLeftChevron");
    document.body.focus();
  } else if (ev.code === "ArrowRight") {
    // Scroll left to the prev image in the post
    ClickInCurr(".coreSpriteRightChevron");
    document.body.focus();
  } else if (ev.code === "KeyZ") {
    // Like/Unlike
    QS(ev.shiftKey ? "[aria-label=Unlike]" : "[aria-label=Like]", CurrOne())?.closest("button")?.click();
    document.body.focus();
  } else if (ev.code === "Enter" || ev.code === "KeyV" || ev.code === "KeyK") {
    // Focus and play video
    let [container, video] = GetVideo();
    if (ClickInCurr("[aria-label=Control][role=button]")) {
      VideoStatus(container, video);
      return;
    }
    if (!container || !video) return;
    video.paused ? (video.play(), video.muted=false) : (video.muted ? video.muted = false : video.pause());
    VideoStatus(container, video);
    document.body.focus();
  } else if (ev.code === 'Period' && ev.shiftKey) {
    // Increase playback speed
    VideoPlaybackRate(rate => rate * 1.25);
    document.body.focus();
  } else if (ev.code === 'Comma' && ev.shiftKey) {
    // Decrease playback speed
    VideoPlaybackRate(rate => rate / 1.25);
    document.body.focus();
  } else if (ev.code === 'Period' && !ev.shiftKey) {
    // Set speed to 1
    VideoPlaybackRate(rate => 1);
    document.body.focus();
  } else if (ev.code === 'BracketRight' || ev.code === "KeyL") {
    // Forward 10 sec or 60 sec with Shift
    VideoPlayPos((pos, len) => pos + 10 + 50*ev.shiftKey);
    document.body.focus();
  } else if (ev.code === 'BracketLeft' || ev.code === "KeyJ") {
    // Backwards 10 sec or 60 sec with Shift
    VideoPlayPos((pos, len) => pos - 10 - 50*ev.shiftKey);
    document.body.focus();
  } else if (ev.code === 'Slash' && ev.shiftKey) {
    // Display help
    Badge(`
<table style="text-align: center;">
<tr><td>Space | PgDown</td><td>Next post</td></tr>
<tr><td>Shift-Space | PgUp | B</td><td>Previous post</td></tr>
<tr><td>Right</td><td>Scroll right to the next image</td></tr>
<tr><td>Left</td><td>Scroll left to the previous image</td></tr>
<tr><td>z, Z</td><td>Like. Unlike</td></tr>
<tr><td>Enter | V | K</td><td>Play/Pause video</td></tr>
<tr><td>] | L</td><td>Skip 10 seconds (+Shift: 1 minute)</td></tr>
<tr><td>[ | J</td><td>Rewind 10 seconds (+Shift: 1 minute)</td></tr>
<tr><td>&gt;</td><td>Increase video speed</td></tr>
<tr><td>&lt;</td><td>Decrease video speed</td></tr>
<tr><td>.</td><td>Reset playback speed to 1</td></tr>
<tr><td>?</td><td>Help</td></tr>
<table>
<BR>
<center>Press any key to close</center>`);
    document.body.focus();
  }
  Cleanup();
});