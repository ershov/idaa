let marked = {};

document.addEventListener("mousedown", ev => {
	if (!ev.altKey) return;
	let div = ev.target.closest('div.js-inline-comments-container');
	let id = div?.querySelector('div[id^=r]')?.id;
  if (!div || !id) {
	  div = ev.target.closest('[id^="review-thread-or-comment-id-"]');
    id = `${div?.id}`.match(/-(\d+)$/)?.[1];
	}
  if (!div || !id) {
	  div = ev.target.closest('[id^="review-thread-or-comment-id-"]');
    id = `${div?.id}`.match(/-(\d+)$/)?.[1];
	}
	if (!div || !id) {
		id = ev.target.closest('a.select-menu-item')?.href?.match(/#r(\d+)$/)?.[1];
	  div = document.querySelector(`#r${id}`)?.closest("div.js-inline-comments-container");
		if (!id || !div) return;
	}
	ev.preventDefault(); ev.stopPropagation();
	id = id.substr(1);
	let m = marked[id] = !marked[id];
	div.style.backgroundColor = m ? "#034" : "";
	document.querySelector('#marked-style')?.remove();
	document.head.insertAdjacentHTML('beforeEnd', `<style id="marked-style">`+
Object.keys(marked).map(x => `[data-hydro-click*='"comment_id":${x}']`).join(", ")+`
{
  background-color: #034;
}
</style>`);
}, true);
