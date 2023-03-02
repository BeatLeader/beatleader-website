<script>
	export let clan;

	$: avatar = clan?.icon ?? null;
</script>

{#if avatar}
	<figure class="image is-24x24" on:click>
		<img src={avatar} alt="" />
	</figure>
{/if}

<style>
	figure {
		position: relative;
		overflow: visible !important;
	}

	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}
</style>
