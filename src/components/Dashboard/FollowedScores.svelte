<script>
	import createServiceParamsManager from '../Player/utils/service-param-manager';
	import ContentBox from '../Common/ContentBox.svelte';
	import Scores from '../Player/Scores.svelte';
	import {SPECIAL_PLAYER_ID} from '../../network/queues/beatleader/api-queue';

	export let browserTitle;
	const serviceParamsManager = createServiceParamsManager(SPECIAL_PLAYER_ID);

	let serviceParams = {sort: 'date', order: 'desc', page: 1, filters: {count: 5}};
	serviceParamsManager.update(serviceParams, 'scores', true);

	function onScoresPageChanged(e) {
		let newPage = e?.detail ?? null;
		if (!newPage) return;

		if (!Number.isFinite(newPage)) newPage = 1;

		serviceParamsManager.update({page: newPage});

		serviceParams = serviceParamsManager.getParams();
	}

	function onScoresParamsChanged(e) {
		const newServiceParams = e?.detail ?? null;
		if (!newServiceParams) return;

		serviceParamsManager.update(newServiceParams);
		serviceParams = serviceParamsManager.getParams();
	}
</script>

<ContentBox>
	<header>
		<h2>
			<div class="title is-5">Scores of Followed</div>
		</h2>
	</header>

	<Scores
		playerId={SPECIAL_PLAYER_ID}
		initialService="scores"
		initialServiceParams={serviceParams}
		on:page-changed={onScoresPageChanged}
		on:service-params-changed={onScoresParamsChanged}
		fixedBrowserTitle={browserTitle}
		withPlayers={true}
		unconstrainedPager={true}
		noIcons={true} />
</ContentBox>
