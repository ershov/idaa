let isFocused = true;
let savedElement;

function doUpdate() {
    if (!isFocused) return;
    let now = new Date();
    [...document.querySelectorAll(`table[aria-readonly="true"] tr[role="row"] td[role="gridcell"] :is(span[aria-label^="Sun, "],span[aria-label^="Mon, "],span[aria-label^="Tue, "],span[aria-label^="Wed, "],span[aria-label^="Thu, "],span[aria-label^="Fri, "],span[aria-label^="Sat, "])`)].forEach(e => {
        savedElement = e;
        let d = (now - new Date(e.title))/24/3600/1000;
        let a = 0.3/(d/7+1);
        e.closest(`tr`).style.background = `hsla(${300 - d * 90 / 7}, 100% , ${Math.max(0, 50 - d/21*50)}%, ${a})`;
    });
}
function periodicUpdate() {
    if (!isFocused || (savedElement?.isConnected && savedElement?.offsetHeight)) return;
    doUpdate();
}

setInterval(periodicUpdate, 2000);

document.addEventListener("click", ()=>setTimeout(doUpdate, 150));
window.addEventListener("focus", ()=>{isFocused=true; doUpdate();});
window.addEventListener("blur", ()=>isFocused=false);
