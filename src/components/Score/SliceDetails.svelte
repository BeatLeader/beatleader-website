<script>
	import {formatNumber} from '../../utils/format';
	import SliceSummary from './SliceSummary.svelte';

	export let sliceDetailsData = null;
	export let sliceSummaryData = null;
	let leftData = null;
	let rightData = null;
	let selectedSecondaryGridIndex = 0;
	let showSecondaryGrid = false;
	let showSummaryGrid = false;
	let summaryIndex = 0;

	function mainGridCellOnClick(index) {
		leftData = sliceDetailsData.mainGrid[index].left;
		rightData = sliceDetailsData.mainGrid[index].right;
		selectedSecondaryGridIndex = index;
		showSecondaryGrid = true;
	}

	function backOnClick() {
		showSecondaryGrid = false;
	}

	function onSummaryHover(evt) {
		summaryIndex = evt.detail.groupIndex;
		showSummaryGrid = true;
	}

	function onSummaryLeave(evt) {
		showSummaryGrid = false;
	}

	function getHighlightClass(mainIndex) {
		const columnIndex = mainIndex % 4;

		switch (summaryIndex) {
			case 0: //Midlanes
				switch (columnIndex) {
					case 1:
						return 'highlight-l';
					case 2:
						return 'highlight-r';
				}
				break;
			case 1: //Outerlanes
				switch (columnIndex) {
					case 0:
						return 'highlight-l';
					case 3:
						return 'highlight-r';
				}
				break;
			case 2: //Crossovers
				switch (columnIndex) {
					case 0:
					case 1:
						return 'highlight-r';
					case 2:
					case 3:
						return 'highlight-l';
				}
				break;
			case 3: //Forehands
			case 4: //Backhands
				return 'main';
		}
		return 'highlight-fade';
	}

	function formatHoverHint(cell) {
		if (!cell.count) return '';
		return formatNumber((cell.averageScore * 100) / 115, 2) + '%';
	}

	function getSecondaryGridRotation(cellIndex) {
		switch (cellIndex) {
			case 0:
				return '135deg';
			case 1:
				return '180deg';
			case 2:
				return '225deg';
			case 3:
				return '90deg';
			case 4:
				return '0deg';
			case 5:
				return '270deg';
			case 6:
				return '45deg';
			case 7:
				return '0deg';
			case 8:
				return '315deg';
		}
		return '0deg';
	}

	function isDot(cellIndex) {
		return cellIndex === 4;
	}
</script>

{#if sliceDetailsData}
	<div class="slice-details">
		{#if showSecondaryGrid}
			<div class="secondary-grid" on:click={backOnClick}>
				{#each leftData as cell, idx}
					<div class="grid-cell left" title={formatHoverHint(cell)} style={'transform: rotate(' + getSecondaryGridRotation(idx) + ');'}>
						{#if isDot(idx)}
							<img src="/assets/noteDot.png" class="note-icon dot" alt="dot" />
						{:else}
							<img src="/assets/noteArrow.png" class="note-icon arrow" alt="arrow" />
						{/if}
						{#if cell.count}
							<p style={'transform: rotate(-' + getSecondaryGridRotation(idx) + ');'}>
								{cell.count}<br />{formatNumber(cell.averageScore, 2)}
							</p>
						{/if}
					</div>
				{/each}
			</div>
			<div class="mini-main-grid" on:click={backOnClick}>
				{#each sliceDetailsData.mainGrid as cell, idx}
					<div class="mini-main-grid-cell {idx === selectedSecondaryGridIndex ? 'selected' : ''}" />
				{/each}
			</div>
			<div class="secondary-grid" on:click={backOnClick}>
				{#each rightData as cell, idx}
					<div class="grid-cell right" title={formatHoverHint(cell)} style={'transform: rotate(' + getSecondaryGridRotation(idx) + ');'}>
						{#if isDot(idx)}
							<img src="/assets/noteDot.png" class="note-icon dot" alt="dot" />
						{:else}
							<img src="/assets/noteArrow.png" class="note-icon arrow" alt="arrow" />
						{/if}
						{#if cell.count}
							<p style={'transform: rotate(-' + getSecondaryGridRotation(idx) + ');'}>
								{cell.count}<br />{formatNumber(cell.averageScore, 2)}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="main-grid">
				{#if showSummaryGrid}
					{#each sliceDetailsData.summaryGrids[summaryIndex] as cell, idx}
						<div class="grid-cell {getHighlightClass(idx)}" title={formatHoverHint(cell)}>
							{#if cell.count}
								<p>{cell.count}<br />{formatNumber(cell.averageScore, 2)}</p>
							{/if}
						</div>
					{/each}
				{:else}
					{#each sliceDetailsData.mainGrid as cell, idx}
						<div class="grid-cell main" title={formatHoverHint(cell)} on:click={() => mainGridCellOnClick(idx)}>
							{#if cell.count}
								<p>{cell.count}<br />{formatNumber(cell.averageScore, 2)}</p>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
			<SliceSummary {sliceSummaryData} on:groupHover={onSummaryHover} on:groupLeave={onSummaryLeave} />
		{/if}
	</div>
{/if}

<style>
	.slice-details {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		flex-wrap: wrap;
	}

	.main-grid {
		display: grid;
		grid-template-columns: auto auto auto auto;
		grid-template-rows: auto auto auto;
		grid-gap: 4px;
	}

	.secondary-grid {
		display: grid;
		grid-template-columns: auto auto auto;
		grid-template-rows: auto auto auto;
		grid-gap: 14px;
		padding: 10px;
	}

	.mini-main-grid {
		display: grid;
		grid-template-columns: auto auto auto auto;
		grid-template-rows: auto auto auto;
		grid-gap: 1px;

		padding: 2px;
		border-radius: 4px;
		background: #00000099;
		box-shadow: #00000066 0px 0px 4px 1px;
	}

	.mini-main-grid:hover {
		background: #00000099;
		box-shadow: #00000099 0px 0px 5px 1px;
	}

	.mini-main-grid-cell {
		width: 10px;
		height: 10px;
		background: #666666;
		border-radius: 2px;
	}

	.mini-main-grid-cell.selected {
		background: #aaaaaa;
	}

	.grid-cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		width: 50px;
		height: 50px;
		border-radius: 4px;

		text-align: center;
		font-size: 12px;
		font-weight: 600;

		box-shadow: #00000066 0px 0px 6px;
	}

	.grid-cell:hover {
		background: #00000099;
		box-shadow: #00000099 0px 0px 6px;
	}

	.grid-cell.main {
		background: linear-gradient(180deg, #88888877, #5a5a5a77);
	}

	.grid-cell.left,
	.grid-cell.highlight-l {
		background: linear-gradient(180deg, #ff5c5ccc, #a54949cc);
	}

	.grid-cell.right,
	.grid-cell.highlight-r {
		background: linear-gradient(180deg, #5c5cffcc, #4949a5cc);
	}

	.grid-cell.highlight-fade {
		background: linear-gradient(180deg, #55555577, #44444477);
	}

	.grid-cell.right > p,
	.grid-cell.left > p {
		padding: 2px;
		border-radius: 12px;
		background: #00000066;
		box-shadow: #000000 0px 0px 2px;
	}

	.note-icon {
		opacity: 25%;
		position: absolute;
	}

	@media screen and (max-width: 767px) {
		.secondary-grid > .grid-cell {
			width: 45px;
			height: 45px;
			font-size: 12px;
		}
	}

	@media screen and (max-width: 520px) {
		.secondary-grid > .grid-cell {
			width: 35px;
			height: 35px;
			font-size: 10px;
		}
	}
</style>
