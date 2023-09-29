<script>
  import {fade} from 'svelte/transition';
  import ContentBox from '../components/Common/ContentBox.svelte';
	import RequestedMapCard from '../components/ReviewHub/RequestedMapCard.svelte';

  export let page;
  export let location;
  if (!page) page = 1;

</script>

<svelte:head>
	<title>BeatLeader - Review Hub | Page {page}</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade|global>
    <ContentBox>
      <h1>
        map list
      </h1>
			<div class="requests">
				<RequestedMapCard />
				<RequestedMapCard />
				<RequestedMapCard />
				<RequestedMapCard />
			</div>
			
    </ContentBox>
  </article>

  <aside>
    <ContentBox>
      <h1>
        filters
      </h1>
    </ContentBox>
  </aside>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: flex-end !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.requests {
		display: flex;
		flex-wrap: wrap;
		column-gap: 1.2em;
		row-gap: 0.8em;
		justify-content: center;
		overflow: visible;
	}

	aside {
		width: 30em;
	}

	aside .filter {
		margin-bottom: 0.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: inline-flex;
		gap: 0.5rem;
		font-weight: 500;
		margin: 0.75rem 0;
	}

	aside .filter:first-child label {
		margin-top: 0;
	}

	aside label select {
		background-color: transparent;
	}

	aside label select option {
		color: var(--textColor);
		background-color: var(--background);
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	aside h2:not(:first-of-type) {
		margin-top: 1.5em;
	}

	aside :global(.rangeSlider.pip-labels) {
		margin-top: 1.5em;
		margin-bottom: 4em;
	}

	.row {
		background-color: #0000009c;
		border-radius: 0.6em;
		padding: 0.6em;
		margin-bottom: 0.6em;
	}

	.map-search .row {
		border-bottom: none;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>