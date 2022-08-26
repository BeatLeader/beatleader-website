<script>
	import {opt} from '../../utils/js';

	export let player;

	$: avatar = opt(player, 'playerInfo.avatar');
</script>

{#if avatar}
	<figure class="image is-24x24" on:click>
		<img src={avatar} alt="" />
	</figure>
{/if}

<style>
	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}
</style>
