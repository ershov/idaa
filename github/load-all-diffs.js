(()=>{
	let fn = ()=>{
		if (document.querySelector('include-fragment.diff-progressive-loader')) {
			setTimeout(fn, 200);
			return;
		}
    let e = document.querySelector('#Load-All-Diffs');
		if (e) return;
		e = document.querySelector('.diffbar .flex-auto [data-pjax="#repo-content-pjax-container"]');
		if (!e) return;
		e.insertAdjacentHTML("beforeEnd", `<button id="Load-All-Diffs" class="btn-sm btn">Load all diffs</button>`);
		e = document.querySelector('#Load-All-Diffs');
		e.addEventListener("click", ()=> {
			[...document.querySelectorAll('button.load-diff-button')].forEach(e => e.click());
			e.remove();
		});
	};
	setTimeout(fn, 300);
	document.head.insertAdjacentHTML('beforeEnd', `<style>
.ellipsis-expander[aria-expanded="false"],
.js-review-hidden-comment-ids *,
.js-review-hidden-comment-ids .color-fg-muted,
.js-review-hidden-comment-ids .ajax-pagination-btn,
.ajax-pagination-form .ajax-pagination-btn,
.js-diff-load-container [data-hide-on-error],
#Load-All-Diffs
{
		background-color: #A00 !important;
}
</style>`);
})();
