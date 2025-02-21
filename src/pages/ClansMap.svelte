<script>
	import GlobalClansMap from '../components/Clans/GlobalClansMap2.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';

	export let leaderboardId;
	export let clanTag;

	let title = 'Clans War Global Map';
	let metaDescription = 'Global map of ranked songs conquest by clans!';
</script>

<GlobalClansMap {leaderboardId} {clanTag} />

<MetaTags
	{title}
	description={metaDescription}
	openGraph={{
		title,
		description: metaDescription,
		images: [{url: 'https://cdn.assets.beatleader.com/clansmap-change-daily-latest.gif'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary_large_image',
		title,
		description: metaDescription,
		image: 'https://cdn.assets.beatleader.com/clansmap-change-daily-latest.gif',
		imageAlt: metaDescription,
	}} />
