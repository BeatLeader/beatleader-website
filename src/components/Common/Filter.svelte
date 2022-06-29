<script>
	import {now} from 'svelte/internal';
	import {tick} from 'svelte';
	import Button from '../Common/Button.svelte'
	import {prefixed} from 'eventemitter3';
	import Switcher from '../Common/Switcher.svelte'
	import CountryPicker from '../Common/CountryPicker.svelte';

	export let filters = [];
	export let sortingMethods = [];
	export let sortingMethodIdentifier="sortBy";
	export let orderMethodIdentifier="order";
	export let onFilterChange = filter => {};
	export let filterChangeTimeRate = 200; //ms


	let nowSortingMethod=sortingMethods[0];

	function deepCopy(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	class FilterResult {
		constructor(raw) {
			this.rawResult = deepCopy(raw) || [];
			this.rawResult.push({
				identifier:sortingMethodIdentifier,
				value:nowSortingMethod
			})
			this.rawResult.push({
				identifier:orderMethodIdentifier,
				value:nowSortingOrder
			})
		}
		getSortBy(){
			return nowSortingMethod
		}
		toUrl(repeatedFilterMode = 'joinComma') {
			let args = {};
			for (let condition of this.rawResult) {
				args[encodeURI(condition.identifier)] ||= [];
				args[encodeURI(condition.identifier)].push(encodeURI(condition.value));
			}

			if ((repeatedFilterMode == 'joinComma')) {
				return Object.keys(args).reduce((pre, cur) => {
					return pre + cur + '=' + args[cur].join(',')+"&";
				}, '');
			}
		}
	}

	let nowFilter = [];

	function showAddFilter() {
		setTimeout(() => {
			addFilterPromptShow = true;
		});
	}

	const defaultValues = {
		bool: false,
		text: '',
	};

	let lastChange = new Date().getTime(),
		lastTrigger = new Date().getTime();

	function addFilter(condition) {
		condition = deepCopy(condition);
		condition.value = condition.default || defaultValues[condition.type];
		nowFilter = nowFilter.concat(condition);
	}

	function deleteFilter(index) {
		nowFilter.splice(index, 1);
		nowFilter = nowFilter;
	}

	setInterval(() => {
		if (lastChange > lastTrigger && new Date().getTime() - lastChange > filterChangeTimeRate) {
			lastTrigger = new Date().getTime();
			onFilterChange(new FilterResult(nowFilter));
		}
	}, 100);

	window.addEventListener('click', e => {
		if (addFilterPromptShow) addFilterPromptShow = false;
	});

	$: addFilterPromptShow = false;

	$: {
		nowFilter;
		nowSortingOrder;
		nowSortingMethod;
		lastChange = new Date().getTime();
	} // Update lastChange when nowFilter changed
</script>

<div class="sorting">

	<Switcher values={sortingMethods} value={nowSortingMethod} on:change={onSortChange}
      />

	{#each sortingMethods as sortingMethod}
	<Button
	icon={sortingMethod.icon}
	iconFa={sortingMethod.iconFa}
	label={sortingMethod.label+((nowSortingMethod==sortingMethod.identifier)?(nowSortingOrder=="desc"?"↓":"↑"):"")}
	title={sortingMethod.title}
	color='black'
	notSelected={nowSortingMethod!=sortingMethod.identifier}
	on:click={() =>{
		if(nowSortingMethod!=sortingMethod.identifier){
			nowSortingMethod=sortingMethod.identifier
			nowSortingOrder="desc"
		}else {
			if(nowSortingOrder=="desc")nowSortingOrder="asc"
			else nowSortingOrder="desc"		
		}
	}}
  />
	{/each}
</div>

<div class="filter">
	<span class="nowFilters">
		{#each nowFilter as condition, thisIndex}
			<div class="activeFilter">
				<span class="name">{condition.name}</span>
				<span class="operations">
					{#if condition.type == 'country'}
						<CountryPicker
							type="smaller"
							on:select={e => {
								condition.value = e.detail.value.toUpperCase();
							}} />
					{/if}

					{#if condition.type == 'bool'}
						<input type="checkbox" bind:checked={condition.value} />
					{/if}

					{#if condition.type == 'radio'}
						<select id={thisIndex} bind:value={condition.value}>
							{#each Object.keys(condition.choices) as choiceVal}
								<option value={choiceVal}>{condition.choices[choiceVal]}</option>
							{/each}
						</select>
					{/if}

					{#if condition.type == 'text'}
						<input type="text" bind:value={condition.value} class="filterInputText" />
					{/if}

					<span
						class="deleteFilter"
						style="color:gray;cursor:pointer;"
						on:click={() => {
							deleteFilter(thisIndex);
						}}>×</span>
				</span>
			</div>
		{/each}
	</span>

	<span class="addFilter" on:click={showAddFilter}> Add Filter </span>
	<div class="availableFilters" style="display:{addFilterPromptShow ? 'block' : 'none'};">
		{#if filters}
			{#each filters as condition}
				{#if !condition.once || nowFilter.find(activeFilter => activeFilter.identifier == condition.identifier) == undefined}
					<span
						class="newFilter"
						on:click={() => {
							addFilter(condition);
						}}>
						{condition.name}
					</span>
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	.filter {
		padding: 0.2rem;
	}

	.addFilter {
		user-select: none;
		border-radius: 0.2rem;
		border-bottom: 0.3rem solid rgba(0, 102, 255, 0.507);
		background: rgba(0, 110, 255, 0.158);
		font-size: 0.8rem;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
		display: inline-block;
	}

	.availableFilters {
		border-bottom: 0.1em solid rgba(0, 110, 255, 0.541);
		background: rgba(0, 110, 255, 0.171);
		padding: 0.4rem;
		margin: 0.4rem;
	}

	.availableFilters .newFilter {
		user-select: none;
		cursor: pointer;
		border-radius: 0.1rem;
		box-shadow: 1px 2px 0.5em rgba(0, 0, 0, 0.199);
		border: 0.1em solid rgba(0, 110, 255, 0.438);
		background: rgba(0, 110, 255, 0.411);
		font-size: 0.8rem;
		padding: 0.2rem 0.4rem;
		margin-right: 0.3rem;
	}

	.activeFilter {
		user-select: none;
		border-radius: 0.2rem;
		box-shadow: 1px 2px 0.5em rgba(0, 0, 0, 0.199);
		border: 0.1em solid rgba(0, 110, 255, 0.185);
		background: rgba(0, 110, 255, 0.13);
		margin: 0.5rem;
		font-size: 0.8rem;
		padding: 0.2rem 0.4rem;
	}

	.activeFilter .operations {
		float: right;
		position: relative;
	}

	.filterInputText {
		width: calc(100% - 5rem);
	}

	select {
		/* height: 34px; */
		/* padding: 6px 12px; */
		/* font-size: 14px; */
		/* line-height: 1.42857143; */
		color: #555;
		background-color: rgb(255, 255, 255);
		background-image: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
		box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
		-webkit-transition: border-color ease-in-out 0.15s, -webkit-box-shadow ease-in-out 0.15s;
		-o-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
		transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
	}
</style>
