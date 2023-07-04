<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';

	export let item = null;
	export let selected = false;

	const dispatch = createEventDispatcher();

	$: url = `/event/${item?.id}` ?? '';
</script>

{#if item}
	<a
		href={url}
		on:click|preventDefault|stopPropagation={() => {
			navigate(url);
			dispatch('close');
		}}>
		<img class="image" src={item?.image} alt="Event icon" />
		<div class="name">{item?.name}</div>
		<div class="leader">
			<small>Leader</small>
			<PlayerNameWithFlag player={item?.leader} />
		</div>
	</a>
{/if}

<style>
	a {
		display: grid;
		grid-template-areas:
			'image name'
			'image leader';
		grid-template-columns: 5rem 1fr;
		grid-gap: 0.5rem;
		align-items: center;
		color: var(--textColor) !important;
	}
	img {
		grid-area: image;
		width: 100%;
		height: 100%;
	}
	.name {
		grid-area: name;
	}
	.leader {
		grid-area: leader;
		align-self: end;
	}
	.leader small {
		display: block;
		font-size: 0.75em;
		font-weight: 500;
		margin-bottom: 0.25em;
	}
</style>
