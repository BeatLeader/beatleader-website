<script>
	import {produce} from 'immer';
	import {createEventDispatcher, onDestroy} from 'svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import {configStore} from '../../stores/config';
	import {debounce} from '../../utils/debounce';
	import {formatNumber} from '../../utils/format';
	import {opt, optSet} from '../../utils/js';

	const dispatch = createEventDispatcher();

	const SAVE_DEBOUNCE_MS = 100;
	const SLIDER_DEBOUNCE_MS = 100;
	const HOLD_DELAY_MS = 325;
	const HOLD_INTERVAL_MS = 65;
	const DEFAULT_VISIBLE_PIP_LABELS = 6;
	const APPROX_PIP_CHAR_WIDTH_PX = 7.5;
	const EPSILON = 0.0000001;

	export let absoluteMin = 0;
	export let absoluteMax = 100;
	export let step = 1;
	export let defaultMinValue = absoluteMin;
	export let defaultMaxValue = absoluteMax;
	export let defaultStartValue = defaultMinValue;
	export let defaultEndValue = defaultMaxValue;
	export let minKey = '';
	export let maxKey = '';
	export let startKey = '';
	export let endKey = '';
	export let minLabel = 'Min';
	export let maxLabel = 'Max';
	export let displayFactor = 1;
	export let suffix = '';

	export let minValue = defaultMinValue;
	export let maxValue = defaultMaxValue;
	export let startValue = defaultStartValue;
	export let endValue = defaultEndValue;

	let minFieldValue = 0;
	let maxFieldValue = 0;
	let lastConfigSignature = '';
	let pendingPersistState = null;
	let holdTimeout = null;
	let holdInterval = null;
	let sliderWidth = 0;

	function getDecimalPlaces(value) {
		if (!Number.isFinite(value)) return 0;

		const text = `${value}`.toLowerCase();
		if (text.includes('e-')) {
			const [base, exponent] = text.split('e-');
			return (base.split('.')[1]?.length ?? 0) + Number(exponent);
		}

		return text.split('.')[1]?.length ?? 0;
	}

	function clamp(value, lower, upper) {
		return Math.min(upper, Math.max(lower, value));
	}

	function roundToPrecision(value, precision) {
		return Number(value.toFixed(precision));
	}

	function roundToStep(value) {
		const normalized = Math.round((value - absoluteMin) / step) * step + absoluteMin;
		return roundToPrecision(normalized, Math.max(getDecimalPlaces(step), 6));
	}

	function createState(minValue, maxValue, startValue, endValue) {
		return {minValue, maxValue, startValue, endValue};
	}

	function statesMatch(first, second) {
		if (!first || !second) return false;

		return (
			Math.abs(first.minValue - second.minValue) <= EPSILON &&
			Math.abs(first.maxValue - second.maxValue) <= EPSILON &&
			Math.abs(first.startValue - second.startValue) <= EPSILON &&
			Math.abs(first.endValue - second.endValue) <= EPSILON
		);
	}

	function normalizeState(nextMinValue, nextMaxValue, nextStartValue, nextEndValue, changedPart = null) {
		let normalizedMin = roundToStep(clamp(nextMinValue, absoluteMin, absoluteMax - step));
		let normalizedMax = roundToStep(clamp(nextMaxValue, absoluteMin + step, absoluteMax));

		if (normalizedMin >= normalizedMax - EPSILON) {
			if (changedPart === 'min') {
				normalizedMin = roundToStep(clamp(normalizedMax - step, absoluteMin, absoluteMax - step));
			} else {
				normalizedMax = roundToStep(clamp(normalizedMin + step, absoluteMin + step, absoluteMax));
			}
		}

		let normalizedStart = roundToStep(clamp(nextStartValue, normalizedMin, normalizedMax - step));
		let normalizedEnd = roundToStep(clamp(nextEndValue, normalizedMin + step, normalizedMax));

		if (normalizedStart >= normalizedEnd - EPSILON) {
			if (changedPart === 'end' || changedPart === 'max') {
				normalizedStart = roundToStep(clamp(normalizedEnd - step, normalizedMin, normalizedMax - step));
			} else {
				normalizedEnd = roundToStep(clamp(normalizedStart + step, normalizedMin + step, normalizedMax));
			}
		}

		normalizedStart = nextStartValue !== null ? roundToStep(clamp(normalizedStart, normalizedMin, normalizedMax - step)) : null;
		normalizedEnd = nextEndValue !== null ? roundToStep(clamp(normalizedEnd, normalizedStart + step, normalizedMax)) : null;

		return createState(normalizedMin, normalizedMax, normalizedStart, normalizedEnd);
	}

	function toDisplayValue(value) {
		return roundToPrecision(value * displayFactor, displayPrecision);
	}

	function fromDisplayValue(value) {
		return value / displayFactor;
	}

	function createConfigSignature(state) {
		return [
			minKey,
			maxKey,
			startKey,
			endKey,
			state.minValue,
			state.maxValue,
			state.startValue,
			state.endValue,
			absoluteMin,
			absoluteMax,
			step,
			displayFactor,
		].join('|');
	}

	let displayMinValue = 0;
	let displayMaxValue = 0;
	let displayStartValue = 0;
	let displayEndValue = 0;

	function syncFieldValues(minValue, maxValue, startValue, endValue) {
		minFieldValue = displayMinValue = toDisplayValue(minValue);
		maxFieldValue = displayMaxValue = toDisplayValue(maxValue);
		displayStartValue = startValue !== null ? toDisplayValue(startValue) : Number.NEGATIVE_INFINITY;
		displayEndValue = endValue !== null ? toDisplayValue(endValue) : Number.POSITIVE_INFINITY;
	}

	function saveState() {
		if (!$configStore || (!minKey && !maxKey && !startKey && !endKey)) return;

		$configStore = produce($configStore, draft => {
			if (minKey) optSet(draft, minKey, minValue);
			if (maxKey) optSet(draft, maxKey, maxValue);
			if (startKey) optSet(draft, startKey, startValue);
			if (endKey) optSet(draft, endKey, endValue);
		});
	}

	const debouncedSaveState = debounce(saveState, SAVE_DEBOUNCE_MS);

	function setState(nextMinValue, nextMaxValue, nextStartValue, nextEndValue, changedPart = null, persist = true) {
		const nextState = normalizeState(nextMinValue, nextMaxValue, nextStartValue, nextEndValue, changedPart);
		const currentState = createState(minValue, maxValue, startValue, endValue);
		const changed = !statesMatch(nextState, currentState);

		var shouldDispatchStartValue = false;
		var shouldDispatchEndValue = false;

		if (Math.abs(nextState.startValue - startValue) > EPSILON) {
			shouldDispatchStartValue = true;
		}
		if (Math.abs(nextState.endValue - endValue) > EPSILON) {
			shouldDispatchEndValue = true;
		}


		minValue = nextState.minValue;
		maxValue = nextState.maxValue;
		startValue = nextState.startValue;
		endValue = nextState.endValue;
		lastConfigSignature = createConfigSignature(nextState);
		syncFieldValues(minValue, maxValue, startValue, endValue);

		if (persist && changed) {
			pendingPersistState = nextState;
			debouncedSaveState();
		}

		if (shouldDispatchStartValue) {
			dispatch('changeStartValue', startValue);
		}
		if (shouldDispatchEndValue) {
			dispatch('changeEndValue', endValue);
		}
	}

	function readStoredValue(config, key, fallback) {
		const value = key ? opt(config, key) : undefined;
		return Number.isFinite(value) ? value : fallback;
	}

	function syncFromConfig(config) {
		if (!config) return;

		const nextState = normalizeState(
			readStoredValue(config, minKey, defaultMinValue),
			readStoredValue(config, maxKey, defaultMaxValue),
			readStoredValue(config, startKey, defaultStartValue),
			readStoredValue(config, endKey, defaultEndValue)
		);

		if (pendingPersistState) {
			if (!statesMatch(nextState, pendingPersistState)) return;
			pendingPersistState = null;
		}

		const signature = createConfigSignature(nextState);
		if (signature === lastConfigSignature) return;

		lastConfigSignature = signature;
		if (minKey) {
			minValue = nextState.minValue;
		}
		if (maxKey) {
			maxValue = nextState.maxValue;
		}
		if (startKey) {
			startValue = nextState.startValue;
		}
		if (endKey) {
			endValue = nextState.endValue;
		}
		syncFieldValues(minValue, maxValue, startValue, endValue);
	}

	function adjustMin(delta) {
		setState(minValue + delta, maxValue, startValue, endValue, 'min');
	}

	function adjustMax(delta) {
		setState(minValue, maxValue + delta, startValue, endValue, 'max');
	}

	function stopButtonHold() {
		clearTimeout(holdTimeout);
		clearInterval(holdInterval);
		holdTimeout = null;
		holdInterval = null;
		window.removeEventListener('pointerup', stopButtonHold);
		window.removeEventListener('pointercancel', stopButtonHold);
		window.removeEventListener('blur', stopButtonHold);
	}

	function startButtonHold(event, callback) {
		if (event.button !== undefined && event.button !== 0) return;

		event.preventDefault();
		stopButtonHold();
		callback();

		holdTimeout = setTimeout(() => {
			holdInterval = setInterval(callback, HOLD_INTERVAL_MS);
		}, HOLD_DELAY_MS);

		window.addEventListener('pointerup', stopButtonHold);
		window.addEventListener('pointercancel', stopButtonHold);
		window.addEventListener('blur', stopButtonHold);
	}

	function handleButtonKeydown(event, callback) {
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();
		callback();
	}

	function commitMinField() {
		if (!Number.isFinite(Number(minFieldValue))) {
			syncFieldValues(minValue, maxValue, startValue, endValue);
			return;
		}

		setState(fromDisplayValue(Number(minFieldValue)), maxValue, startValue, endValue, 'min');
	}

	function commitMaxField() {
		if (!Number.isFinite(Number(maxFieldValue))) {
			syncFieldValues(minValue, maxValue, startValue, endValue);
			return;
		}

		setState(minValue, fromDisplayValue(Number(maxFieldValue)), startValue, endValue, 'max');
	}

	function handleSliderChange(event) {
		const [nextStart, nextEnd] = event.detail.values ?? [];
		if (!Number.isFinite(nextStart) || !Number.isFinite(nextEnd)) return;

		setState(minValue, maxValue, startValue !== null || fromDisplayValue(nextStart) != minValue ? fromDisplayValue(nextStart) : null, endValue !== null || fromDisplayValue(nextEnd) != maxValue ? fromDisplayValue(nextEnd) : null, 'range');
	}

	function getNiceInterval(value) {
		if (!Number.isFinite(value) || value <= 0) return displayStep;

		const magnitude = 10 ** Math.floor(Math.log10(value));
		const normalized = value / magnitude;
		const normalizedStep = [1, 2, 2.5, 5, 10].find(candidate => normalized <= candidate) ?? 10;

		return normalizedStep * magnitude;
	}

	function formatHandleValue(value) {
		return formatNumber(value, displayPrecision);
	}

	function formatPipValue(value, _index, percent) {
		const digits = percent === 0 || percent === 100 ? displayPrecision : pipPrecision;
		return formatNumber(value, digits);
	}

	const debouncedHandleSliderChange = debounce(handleSliderChange, SLIDER_DEBOUNCE_MS);

	$: displayStep = Math.max(step * displayFactor, Number.EPSILON);
	$: displayPrecision = getDecimalPlaces(displayStep);
	$: absoluteDisplayMin = toDisplayValue(absoluteMin);
	$: absoluteDisplayMax = toDisplayValue(absoluteMax);
	$: canDecreaseMin = minValue > absoluteMin + EPSILON;
	$: canIncreaseMin = minValue < maxValue - step - EPSILON;
	$: canDecreaseMax = maxValue > minValue + step + EPSILON;
	$: canIncreaseMax = maxValue < absoluteMax - EPSILON;
	$: pipPrecision = displayStep >= 0.1 ? 0 : Math.min(displayPrecision, 1);
	$: longestPipLabelLength = Math.max(
		formatPipValue(displayMinValue, 0, 0).length,
		formatPipValue(displayMaxValue, 0, 100).length
	);
	$: estimatedPipLabelWidth = Math.max(48, longestPipLabelLength * APPROX_PIP_CHAR_WIDTH_PX + suffix.length * 6 + 16);
	$: maxVisiblePipLabels = sliderWidth ? Math.max(2, Math.floor(sliderWidth / estimatedPipLabelWidth)) : DEFAULT_VISIBLE_PIP_LABELS;
	$: rawPipInterval = (displayMaxValue - displayMinValue) / Math.max(1, maxVisiblePipLabels - 1);
	$: pipInterval = Math.max(displayStep, getNiceInterval(rawPipInterval));
	$: pipStep = Math.max(1, Math.round(pipInterval / displayStep));
	$: syncFromConfig($configStore);
	$: syncFieldValues(minValue, maxValue, startValue, endValue);

	onDestroy(stopButtonHold);
</script>

<div class="bounds-range">
	<div class="bounds-controls">
		<div class="bound-control">
			<span class="bound-label">{minLabel}</span>
			<div class="bound-stepper">
				<button
					type="button"
					class="bound-arrow"
					disabled={!canDecreaseMin}
					title={`Decrease ${minLabel}`}
					on:pointerdown={event => startButtonHold(event, () => adjustMin(-step))}
					on:keydown={event => handleButtonKeydown(event, () => adjustMin(-step))}>
					<i class="fas fa-chevron-left" />
				</button>
				<input
					type="number"
					class="bound-input"
					min={absoluteDisplayMin}
					max={Math.min(absoluteDisplayMax, toDisplayValue(maxValue - step))}
					step={displayStep}
					bind:value={minFieldValue}
					inputmode="decimal"
					aria-label={minLabel}
					on:change={commitMinField}
					on:blur={commitMinField} />
				<button
					type="button"
					class="bound-arrow"
					disabled={!canIncreaseMin}
					title={`Increase ${minLabel}`}
					on:pointerdown={event => startButtonHold(event, () => adjustMin(step))}
					on:keydown={event => handleButtonKeydown(event, () => adjustMin(step))}>
					<i class="fas fa-chevron-right" />
				</button>
			</div>
		</div>

		<div class="bound-control">
			<span class="bound-label">{maxLabel}</span>
			<div class="bound-stepper">
				<button
					type="button"
					class="bound-arrow"
					disabled={!canDecreaseMax}
					title={`Decrease ${maxLabel}`}
					on:pointerdown={event => startButtonHold(event, () => adjustMax(-step))}
					on:keydown={event => handleButtonKeydown(event, () => adjustMax(-step))}>
					<i class="fas fa-chevron-left" />
				</button>
				<input
					type="number"
					class="bound-input"
					min={Math.max(absoluteDisplayMin, toDisplayValue(minValue + step))}
					max={absoluteDisplayMax}
					step={displayStep}
					bind:value={maxFieldValue}
					inputmode="decimal"
					aria-label={maxLabel}
					on:change={commitMaxField}
					on:blur={commitMaxField} />
				<button
					type="button"
					class="bound-arrow"
					disabled={!canIncreaseMax}
					title={`Increase ${maxLabel}`}
					on:pointerdown={event => startButtonHold(event, () => adjustMax(step))}
					on:keydown={event => handleButtonKeydown(event, () => adjustMax(step))}>
					<i class="fas fa-chevron-right" />
				</button>
			</div>
		</div>
	</div>

	<div class="bounds-slider" bind:clientWidth={sliderWidth}>
		<RangeSlider
			range
			min={displayMinValue}
			max={displayMaxValue}
			step={displayStep}
			values={[displayStartValue, displayEndValue]}
			suffix={suffix}
			float
			hoverable
			pips
			pipstep={pipStep}
			all={false}
			first="label"
			last="label"
			rest="label"
			formatter={formatPipValue}
			handleFormatter={formatHandleValue}
			on:change={debouncedHandleSliderChange} />
	</div>
</div>

<style>
	.bounds-range {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.bounds-controls {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.bound-control {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.bound-label {
		font-size: 0.78rem;
		color: var(--faded);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.bound-stepper {
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr) 2.25rem;
		gap: 0.4rem;
		align-items: center;
	}

	.bound-arrow,
	.bound-input {
		border: 0;
		border-radius: 0.45rem;
		background: var(--foreground);
		color: var(--textColor);
	}

	.bound-arrow {
		height: 2.4rem;
		cursor: pointer;
		transition:
			background-color 200ms,
			opacity 200ms;
	}

	.bound-arrow:hover:not(:disabled) {
		background: var(--dimmed);
	}

	.bound-arrow:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.bound-input {
		width: 100%;
		height: 2.4rem;
		text-align: center;
		font-size: 1.1rem;
		font-weight: 600;
		padding: 0 0.55rem;
		-moz-appearance: textfield;
	}

	.bound-input::-webkit-outer-spin-button,
	.bound-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.bounds-slider {
		padding: 0 0.35rem 0 0.1rem;
	}

	:global(.bounds-slider .rangeSlider.pip-labels) {
		margin-bottom: 2.35em;
	}

	:global(.bounds-slider .rangePips) {
		font-size: 0.8rem;
	}

	:global(.bounds-slider .rangePips .pipVal) {
		line-height: 1;
		text-align: center;
		white-space: nowrap;
		transform: translate(-50%, 40%);
	}

	:global(.bounds-slider .rangePips .pip.first .pipVal) {
		left: 0;
		transform: translate(0, 40%);
	}

	:global(.bounds-slider .rangePips .pip.last .pipVal) {
		left: 0;
		transform: translate(-100%, 40%);
	}

	:global(.bounds-slider .rangePips .pip:not(.first):not(.last) .pipVal) {
		min-width: max-content;
	}

	@media screen and (max-width: 480px) {
		.bounds-controls {
			grid-template-columns: 1fr;
		}

		:global(.bounds-slider .rangePips) {
			font-size: 0.72rem;
		}
	}
</style>
