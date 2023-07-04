<script>
	import createServiceParamsManager from '../Player/utils/service-param-manager';
	import ContentBox from '../Common/ContentBox.svelte';
	import Scores from '../Player/Scores.svelte';

	export let browserTitle;

	const SPECIAL_PLAYER_ID = 'user-friends';

	const serviceParamsManager = createServiceParamsManager(SPECIAL_PLAYER_ID);

	let serviceParams = {sort: 'date', order: 'desc', page: 1, filters: {count: 5}};
	serviceParamsManager.update(serviceParams, 'beatleader', true);

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
		initialService="beatleader"
		initialServiceParams={serviceParams}
		on:page-changed={onScoresPageChanged}
		on:service-params-changed={onScoresParamsChanged}
		fixedBrowserTitle={browserTitle}
		withPlayers={true}
		noIcons={true} />
</ContentBox>
