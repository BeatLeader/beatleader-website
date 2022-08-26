<script>
	// Copied from here https://github.com/coussej/svelte-twitter-widgets

	export let href = 'https://twitter.com/sveltejs';
	export let lang = undefined;
	export let showReplies = undefined;
	export let chrome = 'noheader noscrollbar transparent';
	export let theme = 'dark';
	export let width = undefined;
	export let height = '40em';
	export let tweetLimit = 3;
	export let linkColor = undefined;
	export let borderColor = undefined;
	export let ariaPolite = undefined;
	export let dnt = undefined;

	function loadAPI() {
		var id = 'twitter-wjs';

		// if script was already set, don't load it again.
		if (document.getElementById(id)) return;

		var s = document.createElement('script');
		s.id = id;
		s.type = 'text/javascript';
		s.async = true;
		s.src = '//platform.twitter.com/widgets.js';
		document.getElementsByTagName('head')[0].appendChild(s);
	}
	$: loadAPI();
</script>

<a
	class="twitter-timeline"
	{href}
	data-lang={lang}
	data-show-replies={showReplies}
	data-chrome={chrome}
	data-theme={theme}
	data-width={width}
	data-height={height}
	data-tweet-limit={tweetLimit}
	data-link-color={linkColor}
	data-border-color={borderColor}
	data-aria-polite={ariaPolite}
	data-dnt={dnt}>
	Tweets from {href}.
</a>

<style>
	:global(.timeline-Widget) {
		background-color: transparent !important;
	}
</style>
