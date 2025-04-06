<script>
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';
	import {formatDiffStatus, getHumanDiffInfo, mapTypeFromMask} from '../../utils/beatleader/format';

	export let leaderboard;
	export let song;

	$: diffInfo = leaderboard?.diffInfo ? getHumanDiffInfo(leaderboard.diffInfo) : null;
	$: image = song?.imageUrl ?? '';

	$: title = song?.name + ' | ' + diffInfo?.fullName + ' | Beat Saber leaderboard';
	$: description =
		`
    Author: ${song?.author}
  	Mapped by: ${song?.mapper}
    Status: ${formatDiffStatus(leaderboard?.stats?.status ?? '')}
	` +
		(leaderboard?.stats?.passRating ? `Pass: ${leaderboard?.stats?.passRating.toFixed(2)}★ ` : '') +
		(leaderboard?.stats?.accRating ? `Acc: ${leaderboard?.stats?.accRating.toFixed(2)}★ ` : '') +
		(leaderboard?.stats?.techRating ? `Tech: ${leaderboard?.stats?.techRating.toFixed(2)}★\n` : '');
</script>

<MetaTags
	{title}
	{description}
	openGraph={{
		title,
		description,
		images: [{url: image}],
		siteName: ssrConfig.name,
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
