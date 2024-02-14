<script>
	import {navigate} from 'svelte-routing';

	export let label;
	export let destination = null;
</script>

<div class="big-button" on:click={() => (destination ? navigate(destination) : null)}>
	<h1>{label}</h1>
</div>

<style>
	.big-button {
		position: relative;
		width: fit-content;
		padding: 0.5em 2em;
		border-radius: 23px;
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		z-index: 3;
		cursor: pointer;
		transition: transform 150ms ease-in-out;
		overflow: hidden;
	}

	.big-button:before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: -3em;
		bottom: -3em;
		background: rgb(217 24 116);
		background: linear-gradient(130deg, rgb(217 24 116) 0%, rgb(47 36 188) 100%);
		transition: transform 300ms ease-in-out;
		z-index: -1;
	}

	.big-button:hover {
		transform: scale(1.05);
	}

	.big-button:hover:before {
		transform: rotate(20deg);
	}

	.big-button h1 {
		color: #fff;
		font-family: Noto Sans SC;
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
