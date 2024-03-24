<script>
	import {navigate} from 'svelte-routing';

	export let label;
	export let destination = null;
</script>

<a href={destination} class="big-button" on:click|preventDefault={() => (destination ? navigate(destination) : null)}>
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
	}

	.big-button:before {
		content: '';
		position: absolute;
		left: -0.25em;
		right: -0.25em;
		top: -6em;
		bottom: -6em;
		background: rgb(35, 35, 35);
		background: linear-gradient(130deg, rgba(35, 35, 35, 1) 0%, rgba(55, 46, 122, 1) 100%);
		transition: transform 300ms ease-in-out;
		z-index: -1;
	}

	.big-button:hover {
		transform: scale(1.025);
	}

	.big-button:hover:before {
		transform: rotate(50deg);
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
</style>
