<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';

	export let item = null;
	export let selected = false;

	const dispatch = createEventDispatcher();

	$: iconUrl = item?.icon ?? 'https://cdn.assets.beatleader.xyz/NTG.png';
	$: name = item?.name ?? '';
	$: description = item?.description ?? '';
	$: tag = item?.tag ?? '';
	$: color = item?.color ?? '#ff0000';
	$: url = `/clan/${tag}` ?? '';
</script>

{#if item}
	<a
		href={url}
		on:click|preventDefault|stopPropagation={() => {
			navigate(url);
			dispatch('close');
		}}>
		<img class="image" src={iconUrl} alt="ClanIcon" />
		<div class="name-and-tag">
			<span style:--clan-color={color} class="clanTag">{tag}</span>
			<span class="name">{name}</span>
		</div>
		<small>{description}</small>
	</a>
{/if}

<style>
	a {
		display: grid;
		grid-template-areas:
			'image name'
			'image desc';
		grid-template-columns: 5rem 1fr;
		grid-template-rows: min-content 1fr;
		grid-gap: 0.5rem;
		align-items: center;
		color: var(--textColor) !important;
	}
	img {
		grid-area: image;
		width: 100%;
		height: 100%;
	}
	.name-and-tag {
		grid-area: name;
		margin: 0;
		padding: 0;
	}
	.clanTag {
		font-size: 1rem !important;
		color: var(--clan-color, 'white');
	}
	small {
		grid-area: desc;
		font-size: 0.75em;
	}
</style>
