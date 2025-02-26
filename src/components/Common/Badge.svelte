<script>
	import Value from './Value.svelte';

	export let label = null;
	export let fluid = false;
	export let value = 0;
	export let color = 'var(--textColor)';
	export let bgColor = 'var(--background)';
	export let title = '';
	export let zero = '0';
	export let digits = 2;
	export let type = 'number';
	export let prefix = '';
	export let withZeroPrefix = false;
	export let suffix = '';
	export let withZeroSuffix = false;
	export let onlyLabel = false;
	export let clickable = false;
	export let notSelected = false;
	export let styling = '';
	export let prevValue = null;
	export let prevLabel = null;
	export let prevSuffix = null;
	export let reversePrevSign = false;
	export let inline = false;
	export let disabled = false;
	export let iconClass = null;
	export let style = '';
</script>

<span
	class={'badge ' + styling}
	class:clickable
	class:disabled
	class:not-selected={notSelected}
	class:fluid
	style="--color:{color}; --background-color:{bgColor}; {style}"
	{title}
	on:click>
	<span class="label">
		<slot name="label">
			{label}
		</slot>
		{#if iconClass}
			<i class={iconClass} />
		{/if}
	</span>
	{#if !onlyLabel}
		<span class="spacer" />
		<span class="value">
			<slot name="value">
				{#if type === 'number'}<Value
						{value}
						{zero}
						{digits}
						{prefix}
						{withZeroPrefix}
						{suffix}
						{withZeroSuffix}
						{prevValue}
						{prevLabel}
						suffixPrev={prevSuffix}
						{reversePrevSign}
						{inline} />{:else}{value}{/if}
			</slot>
		</span>
	{/if}
	{#if $$slots.additional}<slot name="additional" />{/if}
	{#if $$slots.additionalCompare}<slot name="additionalCompare" />{/if}
</span>

<style>
	.badge {
		position: relative;
		display: inline-flex;
		justify-content: space-around;
		align-items: center;
		color: var(--color, #eee);
		background-color: var(--background-color, #222);
		margin: 0 0.5em 0.5em 0;
		padding: 0.125em;
		border-radius: 0.25em;
		transition: opacity 0.25s;
	}

	.badge.not-selected {
		opacity: 0.35;
	}
	.badge.not-selected:hover {
		opacity: 1;
	}
	.badge.clickable {
		cursor: pointer;
	}

	.badge span {
		display: inline-block;
		width: 50%;
		text-align: center;
		min-width: min-content;
	}

	.badge .spacer {
		width: 1px;
		min-width: auto;
		height: 0.875em;
		margin-top: 0.075em;
		border-left: 1px solid var(--color, #eee);
	}

	.clanInfo {
		margin: 0.25em 0.5em 0.5em 0 !important;
	}

	.badge span.label {
		font-weight: 500;
		font-size: 1em;
		color: inherit;
		margin: 0;
	}

	.badge span.value {
		font-weight: 300;
	}

	.badge.fluid span {
		width: auto;
	}
	.badge.fluid span.label {
		padding: 0 0.5em;
	}
	.badge.fluid span.value {
		padding: 0 0.5em;
	}

	.badge.text:before {
		content: '\A';
		width: 5px;
		height: 5px;
		display: inline-block;
		border-radius: 50%;
		background: var(--textColor);
		margin-right: 0.5rem;
		top: -3px;
		position: relative;
	}
	.badge.text {
		background: transparent !important;
		display: block !important;
		padding: 0 !important;
		margin: 0 0 0.05em 0 !important;
	}
	.badge.text span.label {
		display: inline;
		padding: 0 !important;
	}
	.badge.text span.label:after {
		content: ':';
		margin-left: 0.125em;
		display: inline-block;
	}
	.badge.text span.spacer {
		border-left-width: 0px;
		width: 0;
	}
	.badge.text span.value {
		padding: 0 !important;
		min-width: auto;
	}

	.badge[title]:not([title='']) {
		pointer-events: fill;
	}
</style>
