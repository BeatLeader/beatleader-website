<script>
	export let item = undefined;
</script>

<div class="customItem">
	<img src={item.cover} alt={item.label} />
	<div class="customItem_title">
		<div class="customItem_name">{item.label}</div>
		<div class="customItem_owner">by {item.owner}</div>
	</div>
</div>

<style>
	.customItem {
		display: flex;
		align-items: center;
		padding: 5px;
	}

	img {
		width: 40px;
		height: 40px;
		object-fit: cover;
		border-radius: 4px;
		margin-right: 10px;
	}

	.customItem_title {
		overflow: hidden;
	}

	.customItem_name {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.customItem_owner {
		font-size: 0.8em;
		opacity: 0.7;
	}
</style>
