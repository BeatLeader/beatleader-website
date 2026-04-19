<script>
	import {createEventDispatcher, getContext, onDestroy, onMount} from 'svelte';
	import 'chartjs-adapter-luxon';
	import Chart from 'chart.js/auto';
	import regionsPlugin from './utils/regions-plugin';
	import {formatNumber, GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';
	import {ModifiersList, userDescriptionForModifier} from '../../utils/beatleader/format';
	import {getPPFromAcc, computeModifiedRating, computeStarRating} from '../../utils/beatleader/pp';
	import {configStore} from '../../stores/config';
	import ConfigBoundsRange from '../Common/ConfigBoundsRange.svelte';

	export let passRating = 5;
	export let accRating = 5;
	export let techRating = 5;
	export let modifiersRating = null;
	export let height = '200px';
	export let logarithmic = false;
	export let modifiers = {};
	export let mode;

	const pageContainer = getContext('pageContainer');

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;
	const defaultMinAcc = GLOBAL_LEADERBOARD_TYPE == 'golf' ? 0 : 0.5;
	const defaultMaxAcc = GLOBAL_LEADERBOARD_TYPE == 'golf' ? 0.5 : 1;
	const defaultStartAcc = GLOBAL_LEADERBOARD_TYPE == 'golf' ? 0 : 0.6;
	const defaultEndAcc = GLOBAL_LEADERBOARD_TYPE == 'golf' ? 0.3 : 1;

	let startAcc = defaultStartAcc,
		endAcc = defaultEndAcc,
		minAcc = defaultMinAcc,
		maxAcc = defaultMaxAcc;

	const mutuallyExclusive = {
		NA: ['DA'],
		GN: ['DA'],
		DA: ['GN', 'NA'],
		SS: ['FS', 'SF'],
		FS: ['SF', 'SS'],
		SF: ['FS', 'SS'],
	};
	const HIGHLIGHT_EPSILON = 0.000001;
	const SCRUB_THRESHOLD_PX = 4;
	const SCRUB_PIXELS_PER_STEP = 14;
	const CHART_CLICKABLE_INSET_PX = 2;

	const highlightedPointPlugin = {
		id: 'highlightedPoint',
		afterDatasetsDraw(chart, _args, options) {
			const point = options?.point ?? null;
			const graphs = options?.graphs ?? [];
			if (!point || !graphs.length) return;

			const xScale = chart?.scales?.x;
			const yScale = chart?.scales?.y;
			if (!xScale || !yScale) return;

			const xPixel = xScale.getPixelForValue(point.chartX);
			if (!Number.isFinite(xPixel)) return;

			const {ctx, chartArea} = chart;
			ctx.save();
			ctx.strokeStyle = options?.lineColor ?? '#ffffff66';
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.moveTo(xPixel, chartArea.top);
			ctx.lineTo(xPixel, chartArea.bottom);
			ctx.stroke();
			ctx.setLineDash([]);

			graphs.forEach(graph => {
				if (!Number.isFinite(graph?.y)) return;

				const yPixel = yScale.getPixelForValue(graph.y);
				if (!Number.isFinite(yPixel)) return;

				ctx.beginPath();
				ctx.fillStyle = graph.color;
				ctx.strokeStyle = options?.outlineColor ?? '#1f1f1f';
				ctx.lineWidth = 2;
				ctx.arc(xPixel, yPixel, 4.5, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
			});

			ctx.restore();
		},
	};

	const curveDefinitions = [
		{id: 'pp', label: 'PP', color: '#eb008c', visible: () => true, getY: parts => parts[0]},
		{
			id: 'pass',
			label: 'Pass PP',
			color: 'orange',
			visible: (config, mode) => supportsCurveBreakdown(mode) && config?.ppCurve?.passPp,
			getY: parts => parts[1],
		},
		{
			id: 'acc',
			label: 'Acc PP',
			color: 'purple',
			visible: (config, mode) => supportsCurveBreakdown(mode) && config?.ppCurve?.accPp,
			getY: parts => parts[2],
		},
		{
			id: 'tech',
			label: 'Tech PP',
			color: 'red',
			visible: (config, mode) => supportsCurveBreakdown(mode) && config?.ppCurve?.techPp,
			getY: parts => parts[3],
		},
	];

	let selectedModifiers = [];
	let highlightedPoint = null;
	let highlightedAccInput = '';
	let highlightedGraphInputs = {};
	let activeHighlightedField = null;
	let highlightedScrub = null;

	const roundInputValue = (value, digits = 3) => (Number.isFinite(value) ? Number(value.toFixed(digits)) : 0);

	function supportsCurveBreakdown(mode) {
		return mode !== 'rhythmgamestandard';
	}

	function getCurveParts(acc, passRating, accRating, techRating, mode) {
		const curve = getPPFromAcc(acc, passRating, accRating, techRating, mode);
		return Array.isArray(curve) ? curve : [curve, null, null, null];
	}

	function toHighlightedInputValue(value, digits = 3) {
		return Number.isFinite(value) ? `${roundInputValue(value, digits)}` : '';
	}

	function getNiceStep(value) {
		if (!Number.isFinite(value) || value <= 0) return 0.1;

		const magnitude = 10 ** Math.floor(Math.log10(value));
		const normalized = value / magnitude;
		const normalizedStep = [1, 2, 2.5, 5, 10].find(candidate => normalized <= candidate) ?? 10;
		return normalizedStep * magnitude;
	}

	function clamp(value, minValue, maxValue) {
		return Math.min(maxValue, Math.max(minValue, value));
	}

	function accToChartX(acc, logarithmic) {
		return logarithmic ? 1 - acc : acc;
	}

	function chartXToAcc(x, logarithmic) {
		return logarithmic ? 1 - x : x;
	}

	function clampHighlightedAcc(acc, startAcc, endAcc) {
		return Math.min(endAcc, Math.max(startAcc, acc));
	}

	function getCurveValueRange(graphId, configStore, passRating, accRating, techRating, mode, startAcc, endAcc) {
		const definition = curveDefinitions.find(curve => curve.id === graphId && curve.visible(configStore, mode));
		if (!definition) return null;

		const startY = definition.getY(getCurveParts(startAcc, passRating, accRating, techRating, mode));
		const endY = definition.getY(getCurveParts(endAcc, passRating, accRating, techRating, mode));
		if (!Number.isFinite(startY) || !Number.isFinite(endY)) return null;

		return {
			min: Math.min(startY, endY),
			max: Math.max(startY, endY),
		};
	}

	function buildHighlightedGraphs(configStore, passRating, accRating, techRating, mode, acc) {
		if (!Number.isFinite(acc)) return [];

		const ppParts = getCurveParts(acc, passRating, accRating, techRating, mode);
		return curveDefinitions
			.filter(definition => definition.visible(configStore, mode))
			.map(definition => ({
				id: definition.id,
				label: definition.label,
				color: definition.color,
				x: acc,
				y: definition.getY(ppParts),
			}))
			.filter(graph => Number.isFinite(graph.y));
	}

	function updateHighlightedPoint(acc, startAcc, endAcc, logarithmic) {
		if (!Number.isFinite(acc)) return;

		const clampedAcc = clampHighlightedAcc(acc, startAcc, endAcc);
		highlightedPoint = {
			acc: clampedAcc,
			chartX: accToChartX(clampedAcc, logarithmic),
		};
	}

	function clearHighlightedPoint() {
		highlightedPoint = null;
	}

	function getChartEventCoordinates(event) {
		const x = event?.x ?? event?.native?.offsetX ?? null;
		const y = event?.y ?? event?.native?.offsetY ?? null;
		if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

		return {x, y};
	}

	function isWithinChartArea(chart, event) {
		const chartArea = chart?.chartArea;
		const coordinates = getChartEventCoordinates(event);
		if (!chartArea || !coordinates) return false;

		return (
			coordinates.x > chartArea.left + CHART_CLICKABLE_INSET_PX &&
			coordinates.x < chartArea.right - CHART_CLICKABLE_INSET_PX &&
			coordinates.y > chartArea.top + CHART_CLICKABLE_INSET_PX &&
			coordinates.y < chartArea.bottom - CHART_CLICKABLE_INSET_PX
		);
	}

	function handleChartHover(chart, event) {
		const target = chart?.canvas ?? event?.native?.target;
		if (!target?.style) return;

		target.style.cursor = isWithinChartArea(chart, event) ? 'pointer' : 'default';
	}

	function handleChartClick(chart, event, startAcc, endAcc, logarithmic) {
		const xScale = chart?.scales?.x;
		const coordinates = getChartEventCoordinates(event);
		if (!xScale || !coordinates || !isWithinChartArea(chart, event)) return;

		const chartX = xScale.getValueForPixel(coordinates.x);
		if (!Number.isFinite(chartX)) return;

		updateHighlightedPoint(chartXToAcc(chartX, logarithmic), startAcc, endAcc, logarithmic);
	}

	function solveAccForGraphValue(graphId, targetY, configStore, passRating, accRating, techRating, mode, startAcc, endAcc) {
		const definition = curveDefinitions.find(curve => curve.id === graphId && curve.visible(configStore, mode));
		if (!definition || !Number.isFinite(targetY)) return null;

		let low = startAcc;
		let high = endAcc;
		const lowY = definition.getY(getCurveParts(low, passRating, accRating, techRating, mode));
		const highY = definition.getY(getCurveParts(high, passRating, accRating, techRating, mode));
		if (!Number.isFinite(lowY) || !Number.isFinite(highY)) return null;

		const ascending = highY >= lowY;
		const minY = Math.min(lowY, highY);
		const maxY = Math.max(lowY, highY);
		const target = Math.min(maxY, Math.max(minY, targetY));

		for (let i = 0; i < 40; i += 1) {
			const mid = (low + high) / 2;
			const midY = definition.getY(getCurveParts(mid, passRating, accRating, techRating, mode));
			if (Math.abs(midY - target) < 0.0001) return mid;

			const goRight = ascending ? midY < target : midY > target;
			if (goRight) low = mid;
			else high = mid;
		}

		return (low + high) / 2;
	}

	function isActiveHighlightedField(field) {
		if (!activeHighlightedField || !field) return false;
		if (activeHighlightedField.type !== field.type) return false;
		if (field.type !== 'graph') return true;
		return activeHighlightedField.graphId === field.graphId;
	}

	function setActiveHighlightedField(field) {
		activeHighlightedField = field;
	}

	function clearActiveHighlightedField(field = null) {
		if (!field || isActiveHighlightedField(field)) {
			activeHighlightedField = null;
		}
	}

	function syncHighlightedInputs(point, graphs) {
		if (!point) {
			highlightedAccInput = '';
			highlightedGraphInputs = {};
			return;
		}

		if (!isActiveHighlightedField({type: 'acc'})) {
			highlightedAccInput = toHighlightedInputValue(point.acc * 100, 3);
		}

		highlightedGraphInputs = graphs.reduce(
			(all, graph) => ({
				...all,
				[graph.id]:
					isActiveHighlightedField({type: 'graph', graphId: graph.id}) && highlightedGraphInputs?.[graph.id] !== undefined
						? highlightedGraphInputs[graph.id]
						: toHighlightedInputValue(graph.y, 3),
			}),
			{}
		);
	}

	function handleHighlightedInputKeydown(event, commit) {
		if (event.key !== 'Enter') return;

		event.preventDefault();
		commit();
		event.currentTarget.blur();
	}

	function previewHighlightedAccInput(value) {
		const nextAcc = Number(value);
		const minVisibleAcc = startAcc * 100;
		const maxVisibleAcc = endAcc * 100;
		if (!Number.isFinite(nextAcc) || nextAcc < minVisibleAcc - HIGHLIGHT_EPSILON || nextAcc > maxVisibleAcc + HIGHLIGHT_EPSILON) {
			return false;
		}

		updateHighlightedPoint(nextAcc / 100, startAcc, endAcc, logarithmic);
		return true;
	}

	function previewHighlightedGraphInput(graphId, value) {
		const targetY = Number(value);
		const visibleRange = getCurveValueRange(
			graphId,
			$configStore,
			modifiedPassRating,
			modifiedAccRating,
			modifiedTechRating,
			mode,
			startAcc,
			endAcc
		);

		if (
			!visibleRange ||
			!Number.isFinite(targetY) ||
			targetY < visibleRange.min - HIGHLIGHT_EPSILON ||
			targetY > visibleRange.max + HIGHLIGHT_EPSILON
		) {
			return false;
		}

		const nextAcc = solveAccForGraphValue(
			graphId,
			targetY,
			$configStore,
			modifiedPassRating,
			modifiedAccRating,
			modifiedTechRating,
			mode,
			startAcc,
			endAcc
		);
		if (!Number.isFinite(nextAcc)) return false;

		updateHighlightedPoint(nextAcc, startAcc, endAcc, logarithmic);
		return true;
	}

	function getScrubStep(minValue, maxValue, minimumStep = 0.1) {
		const span = Math.abs(maxValue - minValue);
		if (!Number.isFinite(span) || span <= 0) return minimumStep;
		return Math.max(minimumStep, getNiceStep(span / 240));
	}

	function stopHighlightedScrub(event = null) {
		if (!highlightedScrub) return;
		if (event?.pointerId !== undefined && event.pointerId !== highlightedScrub.pointerId) return;

		highlightedScrub.element?.releasePointerCapture?.(highlightedScrub.pointerId);
		window.removeEventListener('pointermove', handleHighlightedScrubMove);
		window.removeEventListener('pointerup', stopHighlightedScrub);
		window.removeEventListener('pointercancel', stopHighlightedScrub);

		if (document?.body) {
			document.body.style.cursor = highlightedScrub.previousCursor;
			document.body.style.userSelect = highlightedScrub.previousUserSelect;
		}

		highlightedScrub = null;
	}

	function handleHighlightedScrubMove(event) {
		if (!highlightedScrub || event.pointerId !== highlightedScrub.pointerId) return;

		const deltaX = event.clientX - highlightedScrub.startX;
		if (!highlightedScrub.started && Math.abs(deltaX) < SCRUB_THRESHOLD_PX) return;

		if (!highlightedScrub.started) {
			highlightedScrub.started = true;
			highlightedScrub.element?.blur?.();
			if (document?.body) {
				document.body.style.cursor = 'ew-resize';
				document.body.style.userSelect = 'none';
			}
		}

		event.preventDefault();
		const nextValue = clamp(
			highlightedScrub.initialValue + (deltaX / SCRUB_PIXELS_PER_STEP) * highlightedScrub.step,
			highlightedScrub.minValue,
			highlightedScrub.maxValue
		);
		const roundedValue = roundInputValue(nextValue, highlightedScrub.precision);
		if (Math.abs(roundedValue - highlightedScrub.lastValue) <= HIGHLIGHT_EPSILON) return;

		highlightedScrub.lastValue = roundedValue;
		highlightedScrub.onUpdate(roundedValue);
	}

	function startHighlightedScrub(event, options) {
		if (!highlightedPoint || event.button !== 0 || event.pointerType === 'touch' || event.pointerType === 'pen') return;

		stopHighlightedScrub();
		highlightedScrub = {
			pointerId: event.pointerId,
			element: event.currentTarget,
			startX: event.clientX,
			initialValue: options.initialValue,
			lastValue: options.initialValue,
			minValue: options.minValue,
			maxValue: options.maxValue,
			step: options.step,
			precision: options.precision ?? 3,
			onUpdate: options.onUpdate,
			started: false,
			previousCursor: document?.body?.style.cursor ?? '',
			previousUserSelect: document?.body?.style.userSelect ?? '',
		};

		event.currentTarget?.setPointerCapture?.(event.pointerId);
		window.addEventListener('pointermove', handleHighlightedScrubMove);
		window.addEventListener('pointerup', stopHighlightedScrub);
		window.addEventListener('pointercancel', stopHighlightedScrub);
	}

	function startHighlightedAccScrub(event) {
		setActiveHighlightedField({type: 'acc'});
		startHighlightedScrub(event, {
			initialValue: Number(highlightedAccInput || highlightedPoint?.acc * 100 || 0),
			minValue: startAcc * 100,
			maxValue: endAcc * 100,
			step: 0.1,
			precision: 3,
			onUpdate: value => {
				highlightedAccInput = toHighlightedInputValue(value, 3);
				previewHighlightedAccInput(value);
			},
		});
	}

	function startHighlightedGraphScrub(event, graphId) {
		const graph = highlightedGraphs.find(entry => entry.id === graphId);
		const visibleRange = getCurveValueRange(
			graphId,
			$configStore,
			modifiedPassRating,
			modifiedAccRating,
			modifiedTechRating,
			mode,
			startAcc,
			endAcc
		);
		if (!graph || !visibleRange) return;

		setActiveHighlightedField({type: 'graph', graphId});
		startHighlightedScrub(event, {
			initialValue: Number(highlightedGraphInputs?.[graphId] || graph.y || 0),
			minValue: visibleRange.min,
			maxValue: visibleRange.max,
			step: getScrubStep(visibleRange.min, visibleRange.max),
			precision: 3,
			onUpdate: value => {
				highlightedGraphInputs = {...highlightedGraphInputs, [graphId]: toHighlightedInputValue(value, 3)};
				previewHighlightedGraphInput(graphId, value);
			},
		});
	}

	function updateSelected(modifiers) {
		selectedModifiers = selectedModifiers.map(sm => modifiers.find(m => m.name == sm.name)).filter(sm => !!sm);
	}

	async function setupChart(
		canvas,
		configStore,
		passRating,
		accRating,
		techRating,
		mode,
		logarithmic,
		startAcc,
		endAcc,
		highlightedPoint,
		highlightedGraphs
	) {
		if (!canvas) return;

		var gridColor = '#2a2a2a';
		var mainColor = '#eb008c';
		var annotationColor = '#aaa';

		Chart.defaults.color = '#fff';

		if (configStore.preferences.theme == 'flylight') {
			gridColor = '#dadadaaf';
			mainColor = '#eb008c';
			annotationColor = '#aaa';
			Chart.defaults.color = '#757575';
		}

		let annotations = [];
		const totalPPData = [];
		const passPPData = [];
		const accPPData = [];
		const techPPData = [];
		for (let acc = startAcc; acc < endAcc; acc += 0.0001) {
			const ppParts = getCurveParts(acc, passRating, accRating, techRating, mode);
			const pp = ppParts[0];

			totalPPData.push({x: logarithmic ? 1 - acc : acc, y: pp});

			passPPData.push({x: logarithmic ? 1 - acc : acc, y: ppParts[1]});
			accPPData.push({x: logarithmic ? 1 - acc : acc, y: ppParts[2]});
			techPPData.push({x: logarithmic ? 1 - acc : acc, y: ppParts[3]});

			if (acc > startAcc && (acc * 100) % Math.round(((maxAcc - startAcc) * 100) / 8) < 0.001)
				if (pp)
					annotations.push({
						min: acc,
						max: acc,
						color: annotationColor,
						label: `${formatNumber(pp, 0)}pp`,
						position: {horizontal: 'left', vertical: 'top'},
					});
		}

		const datasets = [
			{
				data: totalPPData,
				borderColor: mainColor,
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'PP',
			},
		];

		if (supportsCurveBreakdown(mode) && configStore.ppCurve.passPp) {
			datasets.push({
				data: passPPData,
				borderColor: 'orange',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'Pass PP',
			});
		}
		if (supportsCurveBreakdown(mode) && configStore.ppCurve.accPp) {
			datasets.push({
				data: accPPData,
				borderColor: 'purple',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'Acc PP',
			});
		}
		if (supportsCurveBreakdown(mode) && configStore.ppCurve.techPp) {
			datasets.push({
				data: techPPData,
				borderColor: 'red',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'Tech PP',
			});
		}

		const xAxis = {
			type: logarithmic ? 'logarithmic' : 'linear',
			reverse: logarithmic,
			display: true,
			title: {
				display: false,
				text: 'acc',
			},
			ticks: {
				callback: val => (val * 100 === Math.floor(val * 100) ? (logarithmic ? 1 - val : `${formatNumber(val * 100, 0)}%`) : null),
				autoSkip: true,
			},
			grid: {
				color: gridColor,
			},
			min: startAcc,
			max: endAcc,
		};

		const yAxis = {
			display: true,
			position: 'left',
			title: {
				display: $pageContainer.name !== 'phone',
				text: 'pp',
			},
			ticks: {
				callback: val => (val === Math.floor(val) ? val : null),
				precision: 0,
			},
			grid: {
				color: gridColor,
			},
		};

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					responsive: true,
					animation: {
						duration: 0, // general animation time
					},
					maintainAspectRatio: false,
					layout: {
						padding: {
							right: 0,
						},
					},
					interaction: {
						mode: 'index',
						intersect: false,
					},
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							position: 'nearest',
							callbacks: {
								title(ctx) {
									if (!ctx?.[0]?.raw) return '';

									const accuracy = Math.round(ctx[0].raw?.x * 100000) / 1000;

									return `acc: ${formatNumber(logarithmic ? 100 - accuracy : accuracy, 3)}%`;
								},
								label(ctx) {
									return `${formatNumber(ctx.parsed.y, ctx.dataset.round)} ${ctx.dataset.label}`;
								},
							},
						},
						regions: {
							regions: annotations,
						},
						highlightedPoint: {
							point: highlightedPoint,
							graphs: highlightedGraphs,
							lineColor: annotationColor,
							outlineColor: configStore.preferences.theme == 'flylight' ? '#ffffff' : '#1f1f1f',
						},
					},
					onClick: event => handleChartClick(chart, event, startAcc, endAcc, logarithmic),
					onHover: event => handleChartHover(chart, event),
					scales: {
						x: xAxis,
						y: yAxis,
					},
				},
				plugins: [regionsPlugin, highlightedPointPlugin],
			});
		} else {
			chart.data = {datasets};
			chart.options.scales = {x: xAxis, y: yAxis};
			chart.options.plugins.regions = {
				regions: annotations,
			};
			chart.options.plugins.highlightedPoint = {
				point: highlightedPoint,
				graphs: highlightedGraphs,
				lineColor: annotationColor,
				outlineColor: configStore.preferences.theme == 'flylight' ? '#ffffff' : '#1f1f1f',
			};
			chart.options.onClick = event => handleChartClick(chart, event, startAcc, endAcc, logarithmic);
			chart.options.onHover = event => handleChartHover(chart, event);
			chart.update();
		}
	}

	onMount(() => {
		dispatch('modified-stars', {passRating, accRating, techRating, stars: null});
	});
	const hiddenModifiers = ModifiersList.filter(m => m.hideInFilter).map(m => m.id.toLowerCase());

	$: modifiersArr = Object.entries(modifiers ?? {})
		?.filter(m => m?.[0] !== 'modifierId' && !hiddenModifiers.includes(m[0]))
		?.map(m => ({
			name: m[0]?.toUpperCase() ?? null,
			value: m[1] ?? null,
		}))
		.filter(m => m.name && m.value && m.name != 'NF')
		.sort((a, b) => b.value - a.value);
	$: updateSelected(modifiersArr);

	$: excludedModifiers = selectedModifiers.reduce(
		(all, mod) => (mutuallyExclusive[mod?.name] ? all.concat(mutuallyExclusive[mod.name]) : all),
		[]
	);
	$: modifiedPassRating = computeModifiedRating(passRating, 'PassRating', modifiersRating, selectedModifiers);
	$: modifiedAccRating = computeModifiedRating(accRating, 'AccRating', modifiersRating, selectedModifiers);
	$: modifiedTechRating = computeModifiedRating(techRating, 'TechRating', modifiersRating, selectedModifiers);
	$: modifiedStars =
		selectedModifiers?.length && (passRating !== modifiedPassRating || accRating !== modifiedAccRating || techRating !== modifiedTechRating)
			? computeStarRating(modifiedPassRating, modifiedAccRating, modifiedTechRating)
			: null;
	$: if (highlightedPoint) {
		const clampedAcc = clampHighlightedAcc(highlightedPoint.acc, startAcc, endAcc);
		const expectedChartX = accToChartX(clampedAcc, logarithmic);
		if (
			Math.abs(highlightedPoint.acc - clampedAcc) > HIGHLIGHT_EPSILON ||
			Math.abs(highlightedPoint.chartX - expectedChartX) > HIGHLIGHT_EPSILON
		) {
			updateHighlightedPoint(clampedAcc, startAcc, endAcc, logarithmic);
		}
	}
	$: highlightedGraphs = highlightedPoint
		? buildHighlightedGraphs($configStore, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode, highlightedPoint.acc)
		: [];
	$: syncHighlightedInputs(highlightedPoint, highlightedGraphs);
	$: setupChart(
		canvas,
		$configStore,
		modifiedPassRating,
		modifiedAccRating,
		modifiedTechRating,
		mode,
		logarithmic,
		startAcc,
		endAcc,
		highlightedPoint,
		highlightedGraphs
	);

	function commitHighlightedAcc() {
		if (!highlightedPoint) return;

		const nextAcc = Number(highlightedAccInput);
		if (!Number.isFinite(nextAcc)) {
			syncHighlightedInputs(highlightedPoint, highlightedGraphs);
			return;
		}

		updateHighlightedPoint(nextAcc / 100, startAcc, endAcc, logarithmic);
	}

	function updateHighlightedGraphInput(graphId, value) {
		highlightedGraphInputs = {...highlightedGraphInputs, [graphId]: value};
		previewHighlightedGraphInput(graphId, value);
	}

	function commitHighlightedGraph(graphId) {
		if (!highlightedPoint) return;

		const targetY = Number(highlightedGraphInputs?.[graphId]);
		if (!Number.isFinite(targetY)) {
			syncHighlightedInputs(highlightedPoint, highlightedGraphs);
			return;
		}

		const nextAcc = solveAccForGraphValue(
			graphId,
			targetY,
			$configStore,
			modifiedPassRating,
			modifiedAccRating,
			modifiedTechRating,
			mode,
			startAcc,
			endAcc
		);
		if (!Number.isFinite(nextAcc)) {
			syncHighlightedInputs(highlightedPoint, highlightedGraphs);
			return;
		}

		updateHighlightedPoint(nextAcc, startAcc, endAcc, logarithmic);
	}

	$: dispatch('modified-stars', {
		passRating: modifiedPassRating,
		accRating: modifiedAccRating,
		techRating: modifiedTechRating,
		stars: modifiedStars,
		selectedModifiers,
	});

	onDestroy(stopHighlightedScrub);
</script>

<section class="chart" style="--height: {height}">
	<canvas class="chartjs" bind:this={canvas} height={parseInt(height, 10)} />
</section>

{#if modifiersArr?.length}
	<div class="modifiers">
		{#each modifiersArr as modifier}
			<label
				title={`${userDescriptionForModifier(modifier.name)}: ${formatNumber(modifier.value * 100, 0, true)}%`}
				class:selected={selectedModifiers.includes(modifier)}
				class:disabled={excludedModifiers.includes(modifier.name)}
				on:click={() => {
					if (excludedModifiers.includes(modifier.name)) return;
					selectedModifiers = selectedModifiers.includes(modifier)
						? selectedModifiers.filter(m => m !== modifier)
						: [...selectedModifiers, modifier];
				}}>
				{modifier.name}
			</label>
		{/each}
	</div>
{/if}

<div class="acc-range">
	<ConfigBoundsRange
		absoluteMin={defaultMinAcc}
		absoluteMax={defaultMaxAcc}
		step={0.001}
		defaultMinValue={defaultMinAcc}
		defaultMaxValue={defaultMaxAcc}
		defaultStartValue={defaultStartAcc}
		defaultEndValue={defaultEndAcc}
		minKey="ppCurve.minAcc"
		maxKey="ppCurve.maxAcc"
		startKey="ppCurve.startAcc"
		endKey="ppCurve.endAcc"
		minLabel="Min acc"
		maxLabel="Max acc"
		displayFactor={100}
		suffix="%"
		bind:minValue={minAcc}
		bind:maxValue={maxAcc}
		bind:startValue={startAcc}
		bind:endValue={endAcc} />
</div>

{#if highlightedPoint}
	<div class="highlighted-point-panel">
		<div class="highlighted-point-header">
			<span class="highlighted-point-title">Highlighted Point</span>
			<button type="button" class="highlighted-point-clear" on:click={clearHighlightedPoint}>Clear</button>
		</div>

		<div class="highlighted-point-grid">
			<div class="highlighted-point-row highlighted-point-head">
				<span>Curve</span>
				<span>Acc %</span>
				<span>PP</span>
			</div>

			{#each highlightedGraphs as graph}
				<div class="highlighted-point-row">
					<div class="highlighted-point-legend">
						<span class="highlighted-point-swatch" style={`--graph-color: ${graph.color}`} />
						<span>{graph.label}</span>
					</div>
					<input
						type="number"
						step="0.1"
						class="highlighted-point-input"
						value={highlightedAccInput}
						on:pointerdown={startHighlightedAccScrub}
						on:focus={() => setActiveHighlightedField({type: 'acc'})}
						on:input={event => {
							highlightedAccInput = event.currentTarget.value;
							previewHighlightedAccInput(highlightedAccInput);
						}}
						on:keydown={event => handleHighlightedInputKeydown(event, commitHighlightedAcc)}
						on:change={commitHighlightedAcc}
						on:blur={() => {
							clearActiveHighlightedField({type: 'acc'});
							commitHighlightedAcc();
						}} />
					<input
						type="number"
						step="any"
						class="highlighted-point-input"
						value={highlightedGraphInputs?.[graph.id] ?? ''}
						on:pointerdown={event => startHighlightedGraphScrub(event, graph.id)}
						on:focus={() => setActiveHighlightedField({type: 'graph', graphId: graph.id})}
						on:input={event => updateHighlightedGraphInput(graph.id, event.currentTarget.value)}
						on:keydown={event => handleHighlightedInputKeydown(event, () => commitHighlightedGraph(graph.id))}
						on:change={() => commitHighlightedGraph(graph.id)}
						on:blur={() => {
							clearActiveHighlightedField({type: 'graph', graphId: graph.id});
							commitHighlightedGraph(graph.id);
						}} />
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	section {
		position: relative;
		margin: 1rem auto 0 auto;
		height: var(--height, 300px);
	}

	canvas {
		width: 100% !important;
	}

	.modifiers {
		margin-top: 1rem;
		text-align: center;
		display: flex;
		flex-wrap: wrap;
		align-content: center;
		justify-content: center;
		gap: 0.75em;
	}

	.modifiers > * {
		display: inline-block;
		width: 2.8em;
	}

	.modifiers label {
		transition:
			color 300ms,
			background-color 300ms;
		background-color: #4e4e4e;
		border-radius: 0.3em;
		padding: 0.2em 0.3em;
		cursor: pointer;
	}

	.modifiers label.selected {
		background-color: #838383;
	}

	.modifiers label.disabled {
		color: var(--faded) !important;
		background-color: #212121;
		cursor: default;
	}

	.acc-range {
		margin-top: 1rem;
	}

	.highlighted-point-panel {
		margin-top: 1rem;
		padding: 0.85rem;
		border-radius: 0.5rem;
		background: var(--foreground);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.highlighted-point-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.highlighted-point-title {
		font-weight: 700;
	}

	.highlighted-point-clear {
		border: 0;
		border-radius: 0.35rem;
		background: #4e4e4e;
		color: var(--textColor);
		padding: 0.3rem 0.6rem;
		cursor: pointer;
	}

	.highlighted-point-grid {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.highlighted-point-row {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.85fr) minmax(0, 1fr);
		gap: 0.6rem;
		align-items: center;
	}

	.highlighted-point-row.highlighted-point-head {
		color: var(--faded);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.highlighted-point-legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.highlighted-point-swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 999px;
		background: var(--graph-color, #eb008c);
		flex: none;
	}

	.highlighted-point-row input {
		width: 100%;
		border: 0;
		border-radius: 0.35rem;
		background: #2f2f2f;
		color: var(--textColor);
		padding: 0.45rem 0.6rem;
		-moz-appearance: textfield;
	}

	.highlighted-point-input {
		cursor: ew-resize;
	}

	.highlighted-point-input:focus {
		cursor: text;
	}

	.highlighted-point-row input::-webkit-outer-spin-button,
	.highlighted-point-row input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.highlighted-point-empty {
		color: var(--faded);
		margin: 0;
	}

	@media screen and (max-width: 640px) {
		.highlighted-point-row,
		.highlighted-point-row.highlighted-point-head {
			grid-template-columns: 1fr;
		}

		.highlighted-point-row.highlighted-point-head {
			display: none;
		}
	}
</style>
