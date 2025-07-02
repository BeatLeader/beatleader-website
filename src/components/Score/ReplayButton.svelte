<script>
	import Button from '../Common/Button.svelte';
	import {BL_REPLAYS_URL} from '../../network/queues/beatleader/api-queue';
	import {configStore} from '../../stores/config';

	export let score;

	function webPlayerLink(score, webPlayer) {
		if (score.replay?.length) {
			if (webPlayer == 'arcviewer') {
				return `https://allpoland.github.io/ArcViewer/?replayURL=${score.replay}`;
			} else {
				return `${BL_REPLAYS_URL}?link=${score.replay}`;
			}
		} else if (score.id) {
			if (webPlayer == 'arcviewer') {
				return `https://allpoland.github.io/ArcViewer/?scoreID=${score.id}`;
			} else {
				return `${BL_REPLAYS_URL}?scoreId=${score.id}`;
			}
		}
		return null;
	}

	$: replayUrl = webPlayerLink(score, $configStore.preferences.webPlayer);
</script>

{#if replayUrl}
	<Button iconFa="fas fa-solid fa-play" title="Watch Replay" animated={true} noMargin={true} href={replayUrl} newTab={true} />
{/if}
