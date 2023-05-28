<script>
	import CensusGroup from './CensusGroup.svelte';

	export let censusData = [];

	let selectedGroup = censusData[0];
	let selectedCategory = selectedGroup.categories[0];

	let search = '';

	const selectGroup = group => {
		selectedGroup = group;
		selectedCategory = group.categories[0];
	};

	const selectCategory = category => {
		selectedCategory = category;
	};

	const highlightSearchTerm = (text, search) => {
		const lowerSearch = search.toLowerCase();
		const lowerText = text.toLowerCase();

		if (lowerSearch.length && lowerText.includes(lowerSearch)) {
			const start = lowerText.indexOf(lowerSearch);
			const end = start + lowerSearch.length;

			const before = text.slice(0, start);
			const match = text.slice(start, end);
			const after = text.slice(end);

			return `${before}<span style="background-color: orange">${match}</span>${after}`;
		} else {
			return text;
		}
	};
</script>

<div class="top-container">
	<div class="groups">
		<div>
			<input type="text" bind:value={search} placeholder="Search..." />
		</div>
		{#each censusData as group (group.name)}
			<div class="group {selectedGroup === group ? 'selected' : ''}" on:click={() => selectGroup(group)}>
				{group.name}
			</div>

			{#if selectedGroup === group || (search.length && group.categories.find(c => c.name.toLowerCase().includes(search.toLowerCase())))}
				<div class="categories">
					{#each group.categories as category (category.name)}
						<div
							class="category {selectedCategory === category ? 'selected' : ''}"
							on:click={() => selectCategory(category)}
							title={category.question}>
							{@html highlightSearchTerm(category.name, search)}
							{category.effects ? ' ⚡' : ''}
						</div>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
	<CensusGroup group={selectedGroup} category={selectedCategory} />
</div>

<style>
	.top-container {
		display: flex;
		flex-wrap: wrap-reverse;
		justify-content: center;
	}
	.groups {
		padding: 0.8em;
	}

	.group,
	.category {
		transition: background-color 0.3s ease;
		cursor: pointer;
		padding: 0.2em;
	}

	.group.selected {
		background-color: #804f59;
	}
	.category.selected {
		background-color: #b26f7d;
	}
	.categories {
		padding-left: 20px;
	}

	input {
		background-color: #2f2f2f;
	}
</style>
