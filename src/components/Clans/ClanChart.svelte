<script>
	import Chart from 'chart.js/auto';
	import 'chartjs-adapter-luxon';
	import {onMount, createEventDispatcher} from 'svelte';
	import {formatNumber} from '../../utils/format';
	import {formatDate, dateFromUnix} from '../../utils/date';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {configStore} from '../../stores/config';
	import {navigate} from 'svelte-routing';

	export let clanId = null;

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	async function fetchClanHistory(clanId) {
		const response = await fetch(`${BL_API_URL}clan/${clanId}/history`);
		const data = await response.json();
		return data.map(item => ({
			timestamp: dateFromUnix(item.timestamp),
			globalMapCaptured: item.globalMapCaptured,
		}));
	}

	async function setupChart() {
		if (!canvas || !clanId) return;

		const clanHistory = await fetchClanHistory(clanId);

		const ctx = canvas.getContext('2d');

		const theme = $configStore.preferences.theme;
		const isDarkTheme = theme !== 'flylight';

		const gridColor = isDarkTheme ? '#2a2a2a' : '#e0e0e0';
		const textColor = isDarkTheme ? '#ffffff' : '#000000';
		const lineColor = isDarkTheme ? '#3e95cd' : '#007bff';

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				datasets: [
					{
						label: 'Global % Map Captured',
						data: clanHistory.map(item => ({
							x: item.timestamp,
							y: item.globalMapCaptured * 100,
						})),
						borderColor: lineColor,
						backgroundColor: lineColor,
						fill: false,
						tension: 0.1,
						pointHoverRadius: 8,
						pointHitRadius: 8,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						type: 'time',
						time: {
							unit: 'day',
						},
						grid: {
							color: gridColor,
						},
						ticks: {
							color: textColor,
						},
					},
					y: {
						grid: {
							color: gridColor,
						},
						ticks: {
							color: textColor,
							callback: value => formatNumber(value) + '%',
						},
					},
				},
				plugins: {
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							title: tooltipItems => {
								return formatDate(tooltipItems[0].parsed.x);
							},
							label: context => {
								return `Global Map Captured: ${formatNumber(context.parsed.y)}%`;
							},
						},
					},
					legend: {
						display: false,
					},
				},
				onClick: (event, elements) => {
					if (elements.length > 0) {
						const clickedElement = elements[0];
						const timestamp = clickedElement.element.$context.parsed.x;
						const unixTimestamp = Math.floor(timestamp / 1000);
						navigate(`/clansmap/history/${unixTimestamp}`);
					}
				},
				onHover: (event, elements) => {
					event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
				},
			},
		});

		dispatch('height-changed', {height: canvas.height});
	}

	onMount(() => {
		setupChart();
	});
</script>

<div class="clan-chart">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.clan-chart {
		width: 100%;
		height: 300px;
	}
</style>
