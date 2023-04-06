<script>
	export let value = null;
</script>

<div class="select-wrapper">
	<select bind:value class="select-element" on:change>
		<slot />
	</select>
	<i class="fa fa-chevron-down select-arrow" />
</div>

<style>
	.select-wrapper {
		position: relative;
		display: block;
		cursor: pointer;
	}
	.select-element {
		width: 100%;
		border-radius: 0.4em;
		font-size: 1em;
		padding: 0.5em 2em 0.5em 1em;
		text-overflow: ellipsis;
	}
	.select-element::-ms-expand {
		display: none;
	}
	.select-arrow {
		position: absolute;
		pointer-events: none;

		top: 50%;
		right: 0;
		transform: translate(-0.75em, -50%);
	}
</style>
