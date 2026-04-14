<script>
	import {mapTypeListFromMask} from '../../../utils/beatleader/format';

	export let type;

	$: typeList = mapTypeListFromMask(type);
</script>

{#if type}
	{#each typeList as type, idx}

		<span class="type-icon" style="border: 2px solid {type.foregroundColor};">
			<div class={type.icon} title={type.title} />
		</span>
	{/each}
{/if}

<style>
	.type-icon {
		align-items: center;
		background: #000000d1;
		border-radius: 50%;
		display: inline-flex;
		font-size: 12px;
		height: 26px;
		justify-content: center;
		margin: 1px;
		pointer-events: auto;
		width: 26px;
		color: white;
		opacity: 0.8;
	}

	@media screen and (max-width: 767px) {
		.type-icon {
			height: 20px;
			width: 20px;
			padding-top: 0;
		}
	}
</style>
