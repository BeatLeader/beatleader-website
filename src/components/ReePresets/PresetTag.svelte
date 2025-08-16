<script>
	import {presetTypesDescription} from '../../utils/beatleader/format';

	export let tag;

	$: title = presetTypesDescription[tag].name;
	$: icon = presetTypesDescription[tag].icon;
</script>

<div class="tag-container">
	<img class="tag-image" src={icon} />
	<span class="tag-title">{title}</span>
</div>

<style>
	.tag-container {
		background-color: black;
		border-radius: 8px;
		display: inline-flex;
		padding: 0.5em;
		justify-content: center;
		gap: 0.3em;
		align-items: center;
		margin-right: 0.4em;
		justify-items: center;
	}

	.tag-image {
		width: 1.4em;
		height: 1.4em;
	}
	.tag-title {
		color: white;
	}
</style>
