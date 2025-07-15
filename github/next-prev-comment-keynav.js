let scrollPos = ee => [...(function*(e){do { yield e; } while (e = e.offsetParent);})(ee)].reduce((a, b) => a + b.offsetTop, 0);

let __getPrevNextComments = goprev => {
	let last;
	let winHeight = document.querySelector('html').clientHeight;
	let scrollTop = document.querySelector('html').scrollTop;
	let winSize = document.querySelector('html').clientHeight;
//console.log("================= "+(goprev?"UP":"DOWN"));
//console.log({winHeight, scrollTop, winSize}); let idx=0;
	for (e of document.querySelectorAll('.js-inline-comments-container')) {
		let top = scrollPos(e) - 150 - (winSize-150)/5;
		let bot = top + e.offsetHeight;
//console.log({idx:++idx, pos:top-scrollTop, top, bot, e});
		if (goprev) {
			if (top+30 < scrollTop)
				last = {e, top, bot};
			else
				return last;
		} else {
			if (top-30 > scrollTop) return {e, top, bot};
		}
	}
	return last;
};

let __getPrevNextCommentScroll = goprev => {
	let e = __getPrevNextComments(goprev);
	return e ? e.top : goprev ? 0 : 99999999;
};

document.addEventListener("keydown", ev => {
	if (!(ev.altKey && ev.metaKey && !ev.ctrlKey && !ev.shiftKey)) return;
	if (ev.code != "ArrowDown" && ev.code != "ArrowUp") return;
	ev.preventDefault();
	ev.cancelBubble = true;
	document.querySelector('html').scrollTop = __getPrevNextCommentScroll(ev.code == "ArrowUp");
}, true);
