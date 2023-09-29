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

	h1 > i {
		font-size: 0.875em;
		cursor: pointer !important;
	}

	input {
		width: 100%;
		max-width: 25em;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	.map-search {
		padding-bottom: 2rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--faded);
	}

	.map-search .form {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.map-search input {
		font-size: inherit;
		max-width: none;
	}

	.event-log {
		max-width: calc(100vw - 2rem);
		font-size: 0.85em;
		margin-bottom: 2rem;
	}

	.event-log .wrapper {
		max-height: 70vh;
		overflow-y: scroll;
	}

	.event-log .wrapper::-webkit-scrollbar {
		width: 0.25rem;
	}
	.event-log .wrapper::-webkit-scrollbar-thumb {
		background-color: var(--beatleader-primary, #eb008cff);
		border-radius: 6px;
		border: 3px solid var(--beatleader-primary, #eb008cff);
	}

	.event-log .log-filter {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.event-log table th,
	.event-log table td {
		padding: 0.25em 0.5em;
		vertical-align: middle;
	}

	.event-log table th {
		text-align: center;
	}

	.event-log table th:first-child {
		width: 7em;
	}

	.event-log table td:nth-child(3) {
		text-align: center;
	}

	.event-log table td:nth-child(4) {
		font-weight: bold;
	}

	.event-log table th:nth-child(5) {
		width: 5.5em;
	}

	.event-log tr.ok {
		color: green;
	}

	.event-log tr.error {
		color: orange;
	}

	.event-log :global(.diff) {
		display: block;
		max-height: none;
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

	.song {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.songinfo {
		flex-grow: 1;
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
		max-width: 35rem;
	}

	.songinfo {
		color: var(--alternate);
	}

	.songinfo small {
		margin-left: 0.25em;
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.song img {
		width: 3rem;
		height: 3rem;
		border-radius: 0.4em;
		margin-left: 0.4em;
	}

	.reveal {
		cursor: pointer;
		transition: transform 500ms;
		transform-origin: 0.42em 0.8em;
		margin-left: 0.5rem;
	}

	.reveal.opened {
		transform: rotateZ(180deg);
	}

	.song-diff {
		margin: 1rem 0;
	}

	.song-diff .diff-name {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.song-diff:last-child {
		margin-bottom: 0;
	}

	.song-diff > a {
		margin-bottom: 0.5rem;
	}

	.song-diff .tags {
		margin-top: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		max-width: 30rem;
	}

	.tags :global(.badge-bg) {
		background: rgba(255, 255, 255, 0.123);
		border-bottom: 2px solid transparent;
		border-radius: 0.1rem;
		padding: 0.5rem;
		filter: saturate(0.5) brightness(1.4);
		transform: scale(0.8);
		font-weight: 400 !important;
		color: white !important;
		margin: 0 0;
	}

	.tags :global(.listContainer) {
		background-color: var(--background) !important;
	}

	.totals-and-reveal {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-grow: 1;
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