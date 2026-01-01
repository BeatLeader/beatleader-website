<script>
	import {navigate} from 'svelte-routing';

	export let label;
	export let destination = null;
	export let bgColor = null;
	export let image = null;
</script>

<a
	href={destination}
	class="big-button"
	style="--btn-background-color: {bgColor};"
	on:click|preventDefault={() => (destination ? navigate(destination) : null)}>
	{#if image}
		<img class="bg-image" src={image} alt={label} />
	{/if}
	<h1>{label}</h1>
</a>

<style>
	.big-button {
		position: relative;
		width: fit-content;
		padding: 0.9em 2.3em;
		border-radius: 0.5em;
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		z-index: 3;
		cursor: pointer;
		transition: transform 150ms ease-in-out;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1em;
	}

	.big-button:before {
		content: '';
		position: absolute;
		left: -0.25em;
		right: -0.25em;
		top: -6em;
		bottom: -6em;
		background: var(--btn-background-color);
		transition: transform 300ms ease-in-out;
		z-index: -1;
	}

	.big-button:hover {
		transform: scale(1.025);
	}

	.big-button:hover:before {
		transform: rotate(50deg) scale(1.1);
	}

	.big-button h1 {
		color: #fff;
		font-size: 1.5em;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
		text-align: center;

		-webkit-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.bg-image {
		top: calc(50% - 6em);
		left: calc(50% - 6em);
		height: 4em;
		object-fit: cover;
		z-index: -1;
		margin-left: -1.5em;
		margin-right: -0.5em;
	}
</style>
