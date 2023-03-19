<script>
	import {createEventDispatcher, setContext, tick} from 'svelte';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	const dispatch = createEventDispatcher();

	let inputEl = null;
	let groupsEl = null;
	let handleKeyDown = true;
	let handleMouseOver = false;

	let value = '';
	let searchValue = '';
	let placeholder = 'Enter at least 3 characters...';

	let groups = [];
	let selected = null;

	const findGroup = key => groups.find(g => g.key === key);

	const scrollToSelectedAtTop = (force = false) => {
		if (groupsEl) {
			tick().then(() => {
				handleMouseOver = false;

				const selectedItemEl = groupsEl.querySelector('.item.selected');
				if (selectedItemEl) {
					const selectedItemTop = selectedItemEl.getBoundingClientRect()?.top ?? 0;

					const groupHeaderRect = selectedItemEl.closest('.group')?.querySelector('header')?.getBoundingClientRect();
					if (!groupHeaderRect) return;

					const headerBottom = groupHeaderRect.top + groupHeaderRect.height;

					if (force || selectedItemTop < headerBottom) {
						groupsEl.scrollTo({
							top: selectedItemEl.offsetTop - groupHeaderRect.height - 4,
							behavior: 'smooth',
						});
					}
				} else {
					const selectedGroupEl = groupsEl.querySelector('.group.selected');
					if (!selectedGroupEl) return;

					groupsEl.scrollTo({
						top: selectedGroupEl.offsetTop,
						behavior: 'smooth',
					});
				}
			});
		}
	};

	const scrollToSelectedAtBottom = () => {
		if (groupsEl) {
			const el = groupsEl.querySelector('.item.selected') ?? groupsEl.querySelector('.group.selected');

			el?.scrollIntoView({
				behavior: 'smooth',
				block: 'end',
				inline: 'nearest',
			});
		}
	};

	setContext('search', {
		register(groupInfo) {
			let group = {...groupInfo, items: [], isLoading: false};
			groups = [...groups, group];

			if (!selected)
				selected = {
					group,
					item: null,
				};
		},

		updateLoading(key, isLoading = true) {
			const group = findGroup(key);
			if (!group) return;

			group.isLoading = isLoading;
			group.headerProps = {...group.headerProps, isLoading};

			groups = groups;
		},

		updateHeaderProps(key, props = {}) {
			const group = findGroup(key);
			if (!group) return false;

			group.headerProps = props;
			groups = groups;

			return true;
		},

		updateItemProps(key, props = {}) {
			const group = findGroup(key);
			if (!group) return false;

			group.itemProps = props;
			groups = groups;

			return true;
		},

		updateItems(key, items = [], selectItem = undefined) {
			if (!Array.isArray(items)) return false;

			const group = findGroup(key);
			if (!group) return false;

			group.items = items;
			groups = groups;

			if (selected?.group === group) {
				if (selectItem !== undefined) {
					selected = {group, item: selectItem};
					scrollToSelectedAtTop();
				} else {
					const item = items.find(i => i === selected?.item);
					if (!item) {
						selected = {
							group,
							item: items?.[0] ?? null,
						};

						scrollToSelectedAtTop(true);
					}
				}
			}

			return true;
		},
	});

	function onItemSelected(group, item) {
		return group?.onMessage
			? group.onMessage({
					source: 'item',
					type: 'select',
					value: selected.item,
					...(item?.onClick ? item.onClick() : null),
			  })
			: null;
	}

	function onMouseOver(key, item) {
		const group = findGroup(key);
		if (!group) return;

		selected = {
			group,
			item,
		};
	}

	function onKeyDown(e) {
		if (!groups.length) return;

		const currentGroup = selected?.group ?? groups[0];

		let groupIdx = groups.findIndex(g => g === currentGroup);
		if (groupIdx < 0) return;

		let itemIdx = currentGroup.items.findIndex(i => i === selected?.item);

		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				e.stopPropagation();

				if (!handleKeyDown) return;

				handleMouseOver = false;

				let scrollToBottom = false;

				itemIdx--;
				if (itemIdx < 0) {
					groupIdx--;

					if (groupIdx < 0) {
						groupIdx = groups.length - 1;
						scrollToBottom = true;
					}

					itemIdx = groups[groupIdx].items.length - 1;
				}

				selected = {group: groups[groupIdx], item: groups[groupIdx].items[itemIdx] ?? null};

				if (groupsEl)
					tick().then(() => {
						if (scrollToBottom) return scrollToSelectedAtBottom();

						scrollToSelectedAtTop();
					});
				break;

			case 'ArrowDown':
				e.preventDefault();
				e.stopPropagation();

				if (!handleKeyDown) return;

				handleMouseOver = false;

				let scrollToTop = false;
				itemIdx++;
				if (itemIdx > currentGroup.items.length - 1) {
					itemIdx = 0;

					groupIdx++;
					if (groupIdx > groups.length - 1) {
						groupIdx = 0;
						scrollToTop = true;
					}
				}

				selected = {group: groups[groupIdx], item: groups[groupIdx].items[itemIdx] ?? null};

				if (groupsEl)
					tick().then(() => {
						const selectedItemEl = groupsEl.querySelector('.item.selected');
						if (selectedItemEl) {
							const selectedItemHeight = selectedItemEl.getBoundingClientRect()?.height;
							const groupsRect = groupsEl.getBoundingClientRect();
							if (!selectedItemHeight || !groupsRect) return;

							if (scrollToTop || selectedItemEl.offsetTop + selectedItemHeight > groupsRect.height + groupsEl.scrollTop) {
								scrollToSelectedAtBottom();
							}
						} else {
							const selectedGroupEl = groupsEl.querySelector('.group.selected');
							if (!selectedGroupEl) return;

							const selectedGroupHeight = selectedGroupEl.getBoundingClientRect()?.height;
							if (!selectedGroupHeight) return;

							if (scrollToTop || selectedGroupEl.offsetTop + selectedGroupHeight > groupsEl.scrollTop) {
								scrollToSelectedAtBottom();
							}
						}
					});
				break;

			case 'Tab':
				e.preventDefault();
				e.stopPropagation();

				handleMouseOver = false;

				if (!handleKeyDown) return;

				groupIdx++;
				itemIdx = 0;
				if (groupIdx > groups.length - 1) {
					groupIdx = 0;
				}

				selected = {group: groups[groupIdx], item: groups[groupIdx].items[itemIdx] ?? null};

				scrollToSelectedAtTop(true);
				break;

			case 'Escape':
				e.preventDefault();
				e.stopPropagation();
				dispatch('close');
				break;

			case 'Enter':
				e.preventDefault();
				e.stopPropagation();

				if (searchValue.length >= 3 && value !== searchValue && !isAnyLoading) {
					value = searchValue;
				} else if (selected?.item && selected?.group?.onMessage) {
					onItemSelected(selected.group, selected.item);
				}
				break;

			default:
				if (isAnyLoading) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
		}

		handleKeyDown = false;
	}

	$: isAnyLoading = (groups ?? []).some(g => g.isLoading);

	$: if (selected?.group?.onMessage && selected?.item) {
		selected?.group.onMessage({source: 'item', type: 'hover', value: selected.item});
	}
</script>

<svelte:body on:keydown={e => onKeyDown(e)} on:keyup={() => (handleKeyDown = true)} />

<article>
	<slot {value} />

	<ContentBox>
		<main>
			<header>Search anything</header>

			<span class="close" on:click={() => dispatch('close')}>
				<i class="fas fa-times" />
			</span>

			<section class="search">
				<input
					type="search"
					class:loading={isAnyLoading}
					bind:this={inputEl}
					bind:value={searchValue}
					{placeholder}
					autofocus="true"
					autocomplete="off"
					on:blur={e => e.target.focus()} />

				<span class="button-cont">
					<Button iconFa="fas fa-search" type="text" noMargin={true} on:click={() => (value = searchValue)} />
				</span>
			</section>

			{#if value?.length}
				<section class="groups" bind:this={groupsEl} on:mousemove={() => (handleMouseOver = true)}>
					{#each groups as group}
						<section class="group" class:selected={group === selected?.group}>
							<svelte:component
								this={group.header}
								{...{...(group.headerProps ?? {}), selected: group === selected?.group, isLoading: group.isLoading}}
								on:message={e => (group?.onMessage ? group.onMessage(e?.detail) : null)} />
							{#if group?.items?.length}
								<section class="items">
									{#each group?.items ?? [] as item}
										<div
											class="item"
											class:selected={item === selected?.item}
											on:mouseover={() => {
												if (handleMouseOver) onMouseOver(group.key, item);
											}}
											on:click={() => onItemSelected(group, item)}>
											<svelte:component
												this={item?.component ?? group.item}
												{item}
												{...{
													...(group.itemProps ?? {}),
													...(item.componentProps ?? {}),
													selected: item === selected?.item,
													isLoading: group.isLoading,
												}} />
										</div>
									{/each}
								</section>
							{:else if !group.isLoading}
								<div class="no-items">{group.noItems ?? 'No items.'}</div>
							{/if}
						</section>
					{/each}
				</section>
			{:else}
				<section class="info">
					Type something to search for and press <span class="key">
						<i class="fas fa-level-down-alt fa-rotate-90 hide-touch" />
						<i class="fas fa-search hide-pointer" />
					</span>
				</section>
			{/if}
		</main>

		<footer>
			<span><span class="key">tab</span> to switch group </span>

			<span>
				<span class="key no-margin"><i class="fas fa-arrow-up" /></span>
				<span class="key"><i class="fas fa-arrow-down" /></span> to navigate
			</span>

			<span>
				<span class="key"><i class="fas fa-level-down-alt fa-rotate-90" /></span>
				to select
			</span>

			<span><span class="key">esc</span> to close</span>
		</footer>
	</ContentBox>
</article>

<style>
	article {
		position: relative;
		width: 35rem;
		max-width: 100vw;
		min-height: 100vh;
		margin-inline: auto;
		text-align: left;
		z-index: 10;
	}

	@media (max-width: 35rem) {
		article {
			position: fixed;
			inset: 0;
		}
	}

	article :global(> .content-box) {
		padding: 0 !important;
		overflow-y: hidden;
		margin-top: 0 !important;
		min-height: 100%;
	}

	main {
		position: relative;
		padding: 1rem;
	}

	main > header {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}
	.close {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.search {
		display: flex;
		font-size: 1rem;
		margin-bottom: 1rem;
	}

	input {
		color: var(--textColor);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded) !important;
		outline: none;
		flex-grow: 1;
		padding-bottom: 0.25rem;
		font-size: inherit;
	}

	input.loading {
		color: var(--faded) !important;
	}

	input::-webkit-search-cancel-button {
		display: none;
	}

	.button-cont {
		font-size: 1.1em;
		display: none;
	}
	.button-cont :global(> *) {
		position: relative;
		top: 0.5em;
	}

	.hide-touch,
	.hide-pointer {
		display: inline-block;
	}

	@media (pointer: coarse) {
		.button-cont {
			display: block;
		}
		.hide-touch {
			display: none;
		}
	}
	@media (pointer: fine) {
		.hide-pointer {
			display: none;
		}
	}

	.info {
		padding: 2rem 0 1rem 0;
		text-align: center;
		font-size: 0.875rem;
		color: var(--textColor);
	}

	.groups {
		position: relative;
		max-height: calc(100vh - 13rem);
		overflow-y: scroll;
		overflow-x: hidden;
	}
	@media (max-width: 35rem) {
		.groups {
			max-height: calc(100vh - 8rem);
			max-height: calc(100svh - 8rem);
		}
	}
	::-webkit-scrollbar {
		width: 0.25rem;
	}
	::-webkit-scrollbar-track {
		background: transparent;
	}
	::-webkit-scrollbar-thumb {
		background-color: var(--selected, #3273dc);
		border-radius: 6px;
		border: 3px solid var(--selected, #3273dc);
	}

	.groups :global(header) {
		position: sticky;
		top: 0;
	}

	.group {
		opacity: 0.8;
		transition: opacity 200ms;
	}

	.group:not(:first-child) {
		margin-top: 1rem;
	}

	.group.selected {
		opacity: 1;
	}

	.items > *,
	.no-items {
		padding: 0.25rem;
		margin: 0.25rem 0;
		transition: color 300ms;
	}

	.item {
		cursor: pointer;
		transition: background 100ms;
	}

	.items > *:focus-visible,
	.item.selected {
		background-color: var(--selected);
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: space-evenly;
		flex-wrap: wrap;
		column-gap: 1rem;
		row-gap: 0.5rem;
		padding: 0.5rem;
		font-size: 0.875rem;
		font-weight: 100;
		color: var(--textColor);
		background-color: var(--faded);
		box-shadow: inset 0px 15px 22px -12px rgba(0, 0, 0, 1);
	}

	@media (max-width: 35rem) {
		footer {
			display: none;
		}
	}

	.key {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: 0.25em 0.375em;
		margin: 0 0.125rem 0 0;
		border: 1px solid var(--textColor);
		border-radius: 2px;
		font-size: 0.875em;
		color: var(--textColor);
		background-color: var(--dimmed);
	}
	.key.no-margin {
		margin-right: 0;
	}
</style>
