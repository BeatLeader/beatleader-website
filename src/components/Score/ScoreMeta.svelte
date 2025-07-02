<script>
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';
	import {userDiffNameForDiff} from '../../utils/beatleader/format';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';

	export let score;
	export let leaderboard;

	$: song = leaderboard?.song;
	$: player = score?.player;

	$: image = song?.imageUrl ?? '';
	$: title = `${player?.name} on ${song?.name} by ${song?.author}`;
	$: description = `
        #${score?.score?.rank} with ${Math.round(score?.score?.acc, 2)}%${score?.score?.pp ? 'and ' + Math.round(score?.score?.pp, 2) + 'pp' : ''}${score?.score?.mods?.length ? '(' + score?.score?.mods.join(',') + ')' : ''}
		${userDiffNameForDiff(leaderboard?.difficultyBl?.value)}
		submitted ${formatDateRelative(dateFromUnix(score?.score?.timepost))}
	`;
</script>

<svelte:head>
	<meta name="msapplication-TileColor" content="#a259b5" />
	<meta name="theme-color" content="#a259b5" />
</svelte:head>

<MetaTags
	{title}
	{description}
	openGraph={{
		title,
		description,
		images: [{url: image}],
		siteName: 'Score - ' + ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title,
		description,
		image,
		imageAlt: song?.name + ' cover',
	}} />
