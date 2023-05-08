<script>
	import {Pie, Bar} from 'svelte-chartjs';
	import Select from '../Settings/Select.svelte';

	export let group;

	function getCategoryData(category) {
		return {
			labels: category.values.map(value => value.name),
			datasets: [
				{
					data: category.values.map(value => value.count),
					backgroundColor: [
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.2)',
						'rgba(255, 206, 86, 0.2)',
						'rgba(75, 192, 192, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(255, 159, 64, 0.2)',
					],
				},
			],
		};
	}

	function getEffectData(category) {
		return {
			labels: category.values.map(value => value.name),
			datasets: [
				{
					data: category.values.map(value => value.effect),
					backgroundColor: category.values.map(value => (value.effect >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)')),
				},
			],
		};
	}

	let selectedCategory = group.categories[0];
</script>

<h2>{group.name}</h2>
<div class="category-container">
	<Select bind:value={selectedCategory} options={group.categories} valueSelector={x => x} />
</div>

<div class="charts-container">
	<div class="chart-container">
		<Pie options={{responsive: true, maintainAspectRatio: false}} data={getCategoryData(selectedCategory)} />
	</div>
	<div class="chart-container">
		<Bar options={{responsive: true, maintainAspectRatio: false}} data={getCategoryData(selectedCategory)} />
	</div>
	<div class="chart-container">
		<Bar
			options={{
				responsive: true,
				maintainAspectRatio: false,
				indexAxis: 'y',
				scales: {
					x: {
						beginAtZero: true,
					},
				},
			}}
			data={getEffectData(selectedCategory)} />
	</div>
</div>

<style>
	.category-container {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		margin-bottom: 16px;
	}

	.charts-container {
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
	}
	.chart-container {
		position: relative;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}
</style>
