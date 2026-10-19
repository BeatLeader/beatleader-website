import {derived, readable} from 'svelte/store';
import {navigate} from 'svelte-routing';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import {configStore} from '../../stores/config';
import {HMDs, platformDescription} from '../../utils/beatleader/format';

export const DAY = 60 * 60 * 24;
export const ACCENT = '#eb008c';

// Validated for color blindness in this order, so slots are never reordered or cycled
const SERIES_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
const SERIES_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

export const chartTheme = derived(configStore, config => {
	const light = config?.preferences?.theme === 'flylight';
	const surface =
		typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() : '';

	return {
		light,
		series: light ? SERIES_LIGHT : SERIES_DARK,
		other: light ? '#b4b2ad' : '#5c5b57',
		surface: surface || (light ? '#ffffff' : '#252525'),
		text: light ? '#3a3a3a' : '#eeeeee',
		muted: light ? '#757575' : '#a0a0a0',
		grid: light ? '#dadadaaf' : '#333333',
	};
});

const requests = new Map();

function fetchGlobalStat(path) {
	if (!requests.has(path)) {
		const request = fetch(`${BL_API_URL}stats/global/${path}`)
			.then(response => {
				if (!response.ok) throw new Error(`${response.status}`);
				return response.json();
			})
			.catch(error => {
				requests.delete(path);
				throw error;
			});
		requests.set(path, request);
	}
	return requests.get(path);
}

export const globalStat = path =>
	readable({loading: true}, set => {
		fetchGlobalStat(path).then(
			data => set({data}),
			() => set({error: true})
		);
	});

export const RANGES = [
	{value: '3m', label: '3 months', days: 92},
	{value: '1y', label: '1 year', days: 366},
	{value: 'all', label: 'All time'},
];

export const PERIODS = [
	{value: 'day', label: 'Day', days: 1},
	{value: 'week', label: 'Week', days: 7},
	{value: 'month', label: 'Month', days: 30},
	{value: 'year', label: 'Year', days: 365},
	{value: 'all', label: 'All time'},
];

export function rangeFrom(range) {
	const days = RANGES.find(r => r.value === range)?.days;
	const today = Math.floor(Date.now() / 1000 / DAY) * DAY;
	return days ? today - days * DAY : 0;
}

const rangeStep = range => (range === 'all' ? 7 : 1);

export const rangeQuery = range => `from=${rangeFrom(range)}&step=${rangeStep(range)}`;

export const spanGapsFor = range => rangeStep(range) * 3 * DAY * 1000;

export const TRACKING_MARKERS = [
	{time: 1691020800, label: 'Score uploads saved'},
	{time: 1694736000, label: 'All attempts saved'},
];

export const entityName = entity => entity?.map?.name ?? entity?.player?.name ?? entity?.mapper?.name ?? '';

export const entityImage = entity => entity?.map?.cover ?? entity?.player?.avatar ?? entity?.mapper?.avatar ?? null;

export function entityUrl(entity) {
	if (entity?.map) return entity.map.leaderboardId ? `/leaderboard/global/${entity.map.leaderboardId}/1` : null;
	if (entity?.player) return `/u/${entity.player.id}`;
	if (entity?.mapper)
		return entity.mapper.playerId ? `/u/${entity.mapper.playerId}` : `https://beatsaver.com/profile/${entity.mapper.id}`;
	return null;
}

export function openUrl(url) {
	if (url?.startsWith('http')) window.open(url, '_blank');
	else if (url) navigate(url);
}

export const crosshairPlugin = {
	id: 'statsCrosshair',
	afterDatasetsDraw(chart) {
		const active = chart.tooltip?.getActiveElements?.();
		if (!active?.length) return;

		const {ctx, chartArea} = chart;
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(active[0].element.x, chartArea.top);
		ctx.lineTo(active[0].element.x, chartArea.bottom);
		ctx.lineWidth = 1;
		ctx.strokeStyle = chart.options.plugins.statsCrosshair.color;
		ctx.stroke();
		ctx.restore();
	},
};

export const markersPlugin = {
	id: 'statsMarkers',
	afterDatasetsDraw(chart) {
		const {items, color} = chart.options.plugins.statsMarkers ?? {};
		if (!items?.length) return;

		const {ctx, chartArea, scales} = chart;
		ctx.save();
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 1;
		ctx.font = '11px sans-serif';
		for (const marker of items) {
			const x = scales.x.getPixelForValue(marker.time * 1000);
			if (x < chartArea.left || x > chartArea.right) continue;

			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.moveTo(x, chartArea.top);
			ctx.lineTo(x, chartArea.bottom);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.fillText(marker.label, x + 4, chartArea.top + 12);
		}
		ctx.restore();
	},
};

export const BASE_OPTIONS = {responsive: true, maintainAspectRatio: false, animation: false};

export function timeAxis(theme, range) {
	const from = rangeFrom(range);
	return {
		type: 'time',
		min: from ? from * 1000 : undefined,
		time: {tooltipFormat: 'DD', minUnit: 'day'},
		ticks: {color: theme.muted, maxRotation: 0, autoSkipPadding: 24},
		grid: {display: false},
		border: {color: theme.grid},
	};
}

export const valueAxis = (theme, {ticks, ...options} = {}) => ({
	beginAtZero: true,
	grid: {color: theme.grid},
	border: {display: false},
	...options,
	ticks: {color: theme.muted, ...ticks},
});

export const tooltipStyle = theme => ({
	backgroundColor: theme.light ? '#ffffff' : '#1b1b1b',
	titleColor: theme.text,
	bodyColor: theme.text,
	borderColor: theme.grid,
	borderWidth: 1,
	boxPadding: 4,
	usePointStyle: true,
});

export const timeChartOptions = (theme, range, {y, tooltip, ...plugins} = {}) => ({
	...BASE_OPTIONS,
	interaction: {mode: 'index', intersect: false},
	scales: {x: timeAxis(theme, range), y: valueAxis(theme, y)},
	plugins: {
		legend: {display: false},
		statsCrosshair: {color: theme.muted},
		tooltip: {...tooltipStyle(theme), ...tooltip},
		...plugins,
	},
});

export const headsetLabel = key => HMDs[key]?.name ?? 'Unknown';

export const platformLabel = key => platformDescription[key] ?? (key === 'unknown' ? 'Unknown' : key);

export const modVersionLabel = key => key.replace(/^pc /, 'PC ').replace(/^quest /, 'Quest ');

export const difficultyLabel = name => (name ?? '').replace('Plus', '+');
