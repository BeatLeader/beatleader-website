<script>
	export let item = undefined;
</script>

<div class="customItem">
	<img src={item.avatar} alt={item.label} style={`width: 1.2em; border-radius: 50%;`} />
	<div class="customItem_title">
		<div class="customItem_name">{item.label}</div>
	</div>
</div>

<style>
	.customItem {
		display: flex;
		align-items: center;
	}
	img {
		width: 25px;
		padding: 5px 0;
		margin: 0 10px;
	}
	.customItem_title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.customItem_name {
		display: inline-block;
		font-weight: 400;

		margin-right: 10px;
	}
</style>
