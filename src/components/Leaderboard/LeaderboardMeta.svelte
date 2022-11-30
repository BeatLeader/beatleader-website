<script>
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';
	import {formatDiffStatus, getHumanDiffInfo, mapTypeFromMask} from '../../utils/beatleader/format';

	export let leaderboard;
	export let song;
	export let beatSaverCoverUrl;

	$: diffInfo = leaderboard?.diffInfo ? getHumanDiffInfo(leaderboard.diffInfo) : null;

	$: title = song?.name + ' | ' + (diffInfo?.type !== 'Standard' ? diffInfo?.name : diffInfo?.fullName) + ' | Beat Saber leaderboard';
	$: description = `
    Author: ${song?.authorName}
  	Mapped by: ${song?.levelAuthorName}
    
    ${leaderboard?.stats.type ? 'Type: ' + mapTypeFromMask(leaderboard?.stats.type) : ''}
    Status: ${formatDiffStatus(leaderboard?.stats?.status ?? '')}
    ${leaderboard?.stats?.stars ? 'Stars: ' + leaderboard?.stats?.stars : ''}
	`;
</script>

<MetaTags
	{title}
	{description}
	openGraph={{
		title,
		description,
		image: {url: beatSaverCoverUrl},
		site_name: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title,
		description,
		image: beatSaverCoverUrl,
		imageAlt: song?.name + ' cover',
	}} />
