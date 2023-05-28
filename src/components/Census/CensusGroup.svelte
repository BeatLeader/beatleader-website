<script>
	import {Pie, Bar} from 'svelte-chartjs';
	import Select from '../Settings/Select.svelte';

	export let group;
	export let category = group.categories[0];

	function getCategoryData(category) {
		return {
			labels: category.values.map(value => value.name),
			datasets: [
				{
					data: category.values.map(value => value.count),
					backgroundColor: [
						'rgba(255, 99, 132, 0.5)', // red
						'rgba(54, 162, 235, 0.5)', // blue
						'rgba(255, 206, 86, 0.5)', // yellow
						'rgba(75, 192, 192, 0.5)', // teal
						'rgba(153, 102, 255, 0.5)', // purple
						'rgba(255, 159, 64, 0.5)', // orange
						'rgba(99, 255, 132, 0.5)', // light green
						'rgba(235, 54, 162, 0.5)', // pink
						'rgba(192, 75, 75, 0.5)', // brownish-red
						'rgba(255, 223, 0, 0.5)', // bright yellow
					],
				},
			],
		};
	}

	function getEffectData(category) {
		var values = category.values.filter(v => Number.isFinite(v.effect)).sort((a, b) => b.effect - a.effect);

		return {
			labels: values.map(value => value.name),
			datasets: [
				{
					data: values.map(value => value.effect),
					backgroundColor: values.map(value => (value.effect >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)')),
				},
			],
		};
	}

	var chartTypes = ['Pie', 'Bars'];

	var chartType = chartTypes[0];
</script>

<div class="main-container">
	<span><b>{group.name}</b> - {category.name}</span>
	<span class="question">{category.question}</span>

	<div class="charts-container">
		<div class="chart-and-select-container">
			<div class="chart-container">
				{#if chartType == 'Pie'}
					<Pie
						options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: {
									labels: {
										color: 'white',
									},
								},
								tooltip: {
									callbacks: {
										label(ctx) {
											return ctx.parsed + ' players';
										},
									},
								},
							},
							legend: {
								labels: {
									color: 'white',
									fontSize: 14,
								},
							},
						}}
						data={getCategoryData(category)} />
				{:else}
					<Bar
						options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: {display: false},
								tooltip: {
									callbacks: {
										label(ctx) {
											return ctx.parsed.y + ' players';
										},
									},
								},
							},
							scales: {
								x: {
									ticks: {
										color: 'white',
										fontSize: 14,
									},
								},
								y: {
									ticks: {
										color: 'white',
										fontSize: 14,
									},
								},
							},
						}}
						data={getCategoryData(category)} />
				{/if}
			</div>
			<div class="type-select">
				<Select bind:value={chartType} options={chartTypes} valueSelector={x => x} nameSelector={x => x} />
			</div>
		</div>

		{#if category.effects}
			<div class="effects-container">
				<span>How it correlates with performance?</span>
				<div class="chart-container">
					<Bar
						options={{
							responsive: true,
							maintainAspectRatio: false,
							indexAxis: 'y',
							plugins: {
								legend: {display: false},
								tooltip: {
									callbacks: {
										label(ctx) {
											return (ctx.parsed.x > 0 ? '+' : '') + ctx.parsed.x.toFixed(2) + '%';
										},
									},
								},
							},
							scales: {
								x: {
									beginAtZero: true,
									ticks: {
										color: 'white',
										fontSize: 14,
										callback: function (val) {
											return val + '%';
										},
									},
								},
								y: {
									ticks: {
										color: 'white',
										fontSize: 14,
									},
								},
							},
						}}
						data={getEffectData(category)} />
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;
		flex: 1;
	}
	.chart-and-select-container {
		display: flex;
		flex-direction: column;
	}
	.type-select {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		margin-top: 0.5em;
	}

	.question {
		font-size: larger;
	}

	.charts-container {
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 2em;
		margin-top: 1em;
	}
	.chart-container {
		position: relative;
		height: 25em;
		width: 25em;
		margin: 0 auto;
	}
	.effects-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	@media screen and (max-width: 767px) {
		.chart-container {
			height: 20em;
			width: 20em;
		}

		.question {
			margin-left: 1em;
		}
	}
</style>
