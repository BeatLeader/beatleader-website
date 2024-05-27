<script>
	// import createAccountStore from '../stores/beatleader/account';
	// import createServiceParamsManager from '../components/Player/utils/service-param-manager';
	import ContentBox from '../Common/ContentBox.svelte';
	import RankingTable from '../Ranking/RankingTable.svelte';
	import Spinner from '../Common/Spinner.svelte';

	// const SPECIAL_PLAYER_ID = 'user-friends';

	let page = 1;
	let filters = {sortBy: 'pp'};

	let isLoading = false;
	let pending = null;

	// const serviceParamsManager = createServiceParamsManager(SPECIAL_PLAYER_ID);

	// let serviceParams = {sort: 'date', order: 'desc', page: 1, filters: {count: 5}};
	// serviceParamsManager.update(serviceParams, 'beatleader', true);

	function onRankingPageChanged(e) {
		if (e.detail.initial || !Number.isFinite(e.detail.page)) return;

		page = e.detail.page + 1;
	}
</script>

<ContentBox>
	<div class="ranking leaderboard">
		<header>
			<h2 class="title is-5">
				Ranking of Followed
				{#if isLoading}
					<Spinner />
				{/if}
			</h2>
		</header>

		<RankingTable
			type="followed"
			{page}
			{filters}
			playersPerPage={10}
			noIcons={true}
			useInternalFilters={true}
			showTypeSwitcher={false}
			on:page-changed={onRankingPageChanged}
			on:loading={e => (isLoading = !!e?.detail)}
			on:pending={e => (pending = e?.detail)} />
	</div>
</ContentBox>

<style>
	.columns {
		width: 94%;
	}

	.is-multiline {
		margin-left: 1.5em;
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
	}

	.title.is-4 {
		margin-top: 1.2em;
	}

	.global-ranking-call {
		margin-top: 2em;
	}

	h3 {
		padding: 0.25em 0;
		margin-bottom: 0.75em !important;
		font-size: 1.25em;
	}

	h3 > a {
		display: inline-flex;
		align-items: center;
	}

	h3 .icon {
		display: inline-block;
		width: 4em;
		height: 4em;
		margin-right: 0.5em;
	}

	.box h2 {
		margin-bottom: 0;
	}

	.box h2 {
		display: flex;
		align-items: center;
	}

	.box h2 .title {
		margin-bottom: 0;
	}

	.box h2 .refresh {
		margin-left: 1rem;
		margin-top: -0.25em;
		font-size: 1rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	header nav {
		max-width: 15rem;
	}

	.ranking {
		overflow: hidden;
		font-size: 0.85rem;
	}

	.ranking header nav {
		font-size: 0.8em !important;
	}

	.ranking :global(.ranking-grid-row) {
		grid-template-columns: auto;
	}

	.ranking :global(.clan-badges) {
		font-size: 0.8rem;
	}

	.ranking :global(.steam-stats) {
		display: none;
	}

	.imageLink {
		width: 4em;
		height: 4em;
	}

	.downloadButtons {
		margin-top: 1.5em;
		margin-left: 0.6em;
		margin-bottom: 2em;
		float: center;
	}

	.twitterEmbedMobile {
		display: none;
		width: 100%;
	}

	:global(.twitterBox) {
		width: 100%;
	}

	@media screen and (max-width: 767px) {
		.twitterEmbed {
			display: none;
		}

		.twitterEmbedMobile {
			display: flex;
		}
	}
</style>
