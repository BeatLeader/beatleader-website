<script lang="ts">
    import recentScoresProvider from './stores/providers/recent-scores-api-provider';
    import createApiStore from './stores/api-store.js';

    const initialState =
			{"scores":[{"rank":6,"scoreId":54710091,"score":1504730,"unmodififiedScore":1504730,"mods":"","pp":0,"weight":0,"timeSet":"2021-04-03T20:41:11.000Z","leaderboardId":341962,"songHash":"D266446BE4EB5032A8548457B5A7035C20D59339","songName":"Recursion","songSubName":"","songAuthorName":"Vhure","levelAuthorName":"Savage","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":0},{"rank":119,"scoreId":54708801,"score":354963,"unmodififiedScore":354963,"mods":"","pp":0,"weight":0,"timeSet":"2021-04-03T20:22:42.000Z","leaderboardId":343228,"songHash":"5E51E3CAC6B1DC3376F776F6E6B961B754FF9CC4","songName":"Chapter 99: Afterword","songSubName":"","songAuthorName":"t+pazolite","levelAuthorName":"Emilia","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":0},{"rank":15,"scoreId":54708697,"score":947574,"unmodififiedScore":947574,"mods":"","pp":0,"weight":0,"timeSet":"2021-04-03T20:16:39.000Z","leaderboardId":344685,"songHash":"12E3EC0E91CF5956ED61CD0C5BE4E484801F9618","songName":"Up & Down","songSubName":"","songAuthorName":"Marnik","levelAuthorName":"cat_using_a_toaster","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":0},{"rank":57,"scoreId":54708123,"score":871896,"unmodififiedScore":871896,"mods":"","pp":0,"weight":0,"timeSet":"2021-04-03T20:10:57.000Z","leaderboardId":344065,"songHash":"247E7CD970F32FAFD9A14DE4904EE20EF19EA745","songName":"REANIMATE","songSubName":"","songAuthorName":"Warak","levelAuthorName":"epicmoo34 & TheWildDash","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":0},{"rank":205,"scoreId":49673077,"score":1714571,"unmodififiedScore":1714571,"mods":"","pp":0,"weight":0,"timeSet":"2021-04-02T22:27:13.000Z","leaderboardId":278696,"songHash":"F1483AC9D5CED016CE70A84C14E34ADA36FBEE87","songName":"Automaton","songSubName":"","songAuthorName":"Laur","levelAuthorName":"cerret","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":0},{"rank":51,"scoreId":50240513,"score":972823,"unmodififiedScore":972823,"mods":"","pp":315.191,"weight":0.0087525111909217,"timeSet":"2021-04-02T21:38:47.000Z","leaderboardId":301847,"songHash":"07B03E2F73C31ABEBBC43A2B2AC085720297CF85","songName":"Not Gonna Get Us","songSubName":"","songAuthorName":"t.A.T.u","levelAuthorName":"Emilia","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":1025915},{"rank":119,"scoreId":53807923,"score":1016714,"unmodififiedScore":1016714,"mods":"","pp":345.245,"weight":0.30860385037348,"timeSet":"2021-04-02T20:47:53.000Z","leaderboardId":331628,"songHash":"F897EBEED22C678F9758EABEFB9E9C032A8E371C","songName":"Nana","songSubName":"","songAuthorName":"Geoxor","levelAuthorName":"Skeelie","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":1080195},{"rank":12,"scoreId":54641274,"score":1149940,"unmodififiedScore":1149940,"mods":"","pp":0,"weight":0,"timeSet":"2021-04-02T20:38:08.000Z","leaderboardId":344849,"songHash":"D2D118D389AE0A27479E8A4910E4A71B2FAFF1C7","songName":"Your Voice So...","songSubName":"(android52 Remix) [feat.Such]","songAuthorName":"PSYQUI","levelAuthorName":"Meldi","difficulty":9,"difficultyRaw":"_ExpertPlus_SoloStandard","maxScore":0}]};

    let recentScoresStore = createApiStore(recentScoresProvider, '76561198035381239', 1, initialState);

    let isLoading = recentScoresStore.isLoading;
    let pending = recentScoresStore.pending;

    function fetchPageAndAdvance(page) {
        recentScoresStore.fetch(page);
    }

    function refetch() {
    	recentScoresStore.refetch();
		}

		function changePlayer(playerId) {
    	recentScoresStore.fetch(1, playerId);
		}

		$: page = $recentScoresStore ? recentScoresStore.getPage() : null;
    $: playerId = $recentScoresStore ? recentScoresStore.getPlayerId() : null;

    $: {
    	console.log($recentScoresStore)
		}
</script>

<main>
	Current player: {playerId}, current page: {page}, isLoading: {$isLoading}, pending: {JSON.stringify($pending)}
	<pre>
		{JSON.stringify($recentScoresStore, null, 2)}
	</pre>

  <button on:click={() => fetchPageAndAdvance(page + 1)} disabled={$isLoading}>Fetch page {page + 1}</button>
	<button on:click={refetch} disabled={$isLoading}>Refetch</button>
	<button on:click={() => changePlayer('76561198025451538')} disabled={$isLoading}>Change to Drakonno</button>
</main>

<style>
		pre {
			width: 800px;
			height: 600px;
			border: 1px solid red;
			overflow: scroll;
		}
</style>