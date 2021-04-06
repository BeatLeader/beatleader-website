<script>
    import createApiScoresStore from './stores/api-scores-store.js';

    const motzelId = '76561198035381239';
    const drakonnoId = '76561198025451538';

    const initialPlayerId = motzelId;
    const initialType = 'recent';

    const pages = Array(10).fill(0).map((v, idx) => idx + 1);

    const initialState =
        {
            scores: [{
                "rank": 6,
                "scoreId": 54710091,
                "score": 1504730,
                "unmodififiedScore": 1504730,
                "mods": "",
                "pp": 0,
                "weight": 0,
                "timeSet": "2021-04-03T20:41:11.000Z",
                "leaderboardId": 341962,
                "songHash": "D266446BE4EB5032A8548457B5A7035C20D59339",
                "songName": "Recursion",
                "songSubName": "",
                "songAuthorName": "Vhure",
                "levelAuthorName": "Savage",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 0
            }, {
                "rank": 119,
                "scoreId": 54708801,
                "score": 354963,
                "unmodififiedScore": 354963,
                "mods": "",
                "pp": 0,
                "weight": 0,
                "timeSet": "2021-04-03T20:22:42.000Z",
                "leaderboardId": 343228,
                "songHash": "5E51E3CAC6B1DC3376F776F6E6B961B754FF9CC4",
                "songName": "Chapter 99: Afterword",
                "songSubName": "",
                "songAuthorName": "t+pazolite",
                "levelAuthorName": "Emilia",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 0
            }, {
                "rank": 15,
                "scoreId": 54708697,
                "score": 947574,
                "unmodififiedScore": 947574,
                "mods": "",
                "pp": 0,
                "weight": 0,
                "timeSet": "2021-04-03T20:16:39.000Z",
                "leaderboardId": 344685,
                "songHash": "12E3EC0E91CF5956ED61CD0C5BE4E484801F9618",
                "songName": "Up & Down",
                "songSubName": "",
                "songAuthorName": "Marnik",
                "levelAuthorName": "cat_using_a_toaster",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 0
            }, {
                "rank": 57,
                "scoreId": 54708123,
                "score": 871896,
                "unmodififiedScore": 871896,
                "mods": "",
                "pp": 0,
                "weight": 0,
                "timeSet": "2021-04-03T20:10:57.000Z",
                "leaderboardId": 344065,
                "songHash": "247E7CD970F32FAFD9A14DE4904EE20EF19EA745",
                "songName": "REANIMATE",
                "songSubName": "",
                "songAuthorName": "Warak",
                "levelAuthorName": "epicmoo34 & TheWildDash",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 0
            }, {
                "rank": 205,
                "scoreId": 49673077,
                "score": 1714571,
                "unmodififiedScore": 1714571,
                "mods": "",
                "pp": 0,
                "weight": 0,
                "timeSet": "2021-04-02T22:27:13.000Z",
                "leaderboardId": 278696,
                "songHash": "F1483AC9D5CED016CE70A84C14E34ADA36FBEE87",
                "songName": "Automaton",
                "songSubName": "",
                "songAuthorName": "Laur",
                "levelAuthorName": "cerret",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 0
            }, {
                "rank": 51,
                "scoreId": 50240513,
                "score": 972823,
                "unmodififiedScore": 972823,
                "mods": "",
                "pp": 315.191,
                "weight": 0.0087525111909217,
                "timeSet": "2021-04-02T21:38:47.000Z",
                "leaderboardId": 301847,
                "songHash": "07B03E2F73C31ABEBBC43A2B2AC085720297CF85",
                "songName": "Not Gonna Get Us",
                "songSubName": "",
                "songAuthorName": "t.A.T.u",
                "levelAuthorName": "Emilia",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 1025915
            }, {
                "rank": 119,
                "scoreId": 53807923,
                "score": 1016714,
                "unmodififiedScore": 1016714,
                "mods": "",
                "pp": 345.245,
                "weight": 0.30860385037348,
                "timeSet": "2021-04-02T20:47:53.000Z",
                "leaderboardId": 331628,
                "songHash": "F897EBEED22C678F9758EABEFB9E9C032A8E371C",
                "songName": "Nana",
                "songSubName": "",
                "songAuthorName": "Geoxor",
                "levelAuthorName": "Skeelie",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 1080195
            }, {
                "rank": 12,
                "scoreId": 54641274,
                "score": 1149940,
                "unmodififiedScore": 1149940,
                "mods": "",
                "pp": 0,
                "weight": 0,
                "timeSet": "2021-04-02T20:38:08.000Z",
                "leaderboardId": 344849,
                "songHash": "D2D118D389AE0A27479E8A4910E4A71B2FAFF1C7",
                "songName": "Your Voice So...",
                "songSubName": "(android52 Remix) [feat.Such]",
                "songAuthorName": "PSYQUI",
                "levelAuthorName": "Meldi",
                "difficulty": 9,
                "difficultyRaw": "_ExpertPlus_SoloStandard",
                "maxScore": 0
            }]
        };

    let recentScoresStore = createApiScoresStore(initialPlayerId, initialType, 1, initialState);

    let isLoading = recentScoresStore.isLoading;
    let pending = recentScoresStore.pending;
    let error = recentScoresStore.error;

    function fetchPage(page) {
        recentScoresStore.fetch(page);
    }

    function changePlayer(playerId) {
        recentScoresStore.fetch(1, type, playerId);
    }

    function changeType(type) {
      recentScoresStore.fetch(1, type);
    }

    $: page = $recentScoresStore ? recentScoresStore.getPage() : null;
    $: playerId = $recentScoresStore ? recentScoresStore.getPlayerId() : null;
    $: type = $recentScoresStore ? recentScoresStore.getType() : null;

    $: {
        console.log($recentScoresStore)
    }
</script>

<main>
  <div>
    Player:
    <button on:click={() => changePlayer(motzelId)} disabled={[$pending?.playerId, playerId].includes(motzelId)}>
      {#if $pending?.playerId === motzelId && $pending?.playerId !== playerId}
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {/if}

      motzel
    </button>

    <button on:click={() => changePlayer(drakonnoId)} disabled={[$pending?.playerId, playerId].includes(drakonnoId)}>
      {#if $pending?.playerId === drakonnoId && $pending?.playerId !== playerId}
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {/if}

      Drakonno
    </button>
  </div>

  <div>
    Type:
    <button on:click={() => changeType('recent')} disabled={[$pending?.type, type].includes('recent')}>
      {#if $pending?.type === 'recent' && $pending?.type !== type}
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {/if}
      Recent
    </button>
    <button on:click={() => changeType('top')} disabled={[$pending?.type, type].includes('top')}>
      {#if $pending?.type === 'top' && $pending?.type !== type}
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {/if}
      Top
    </button>
  </div>

  <pre>
		{JSON.stringify($recentScoresStore, null, 2)}
	</pre>

  <div class="pages">
    {#each pages as p}
      <button on:click={() => fetchPage(p)} disabled={[page, $pending?.page].includes(p)}>
        {#if $pending?.page === p}
          <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          {p}
        {/if}
      </button>
    {/each}
  </div>

  {#if $error}
    <div class="error">{$error?.toString()}</div>
  {/if}
</main>

<style>
    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }

    pre {
        width: 800px;
        height: 600px;
        border: 1px solid red;
        overflow: scroll;
    }

    .error {
        color: red;
        font-weight: 500;
    }

    .spinner {
        width: 1rem;
        height: 1rem;
        animation: spin 1s linear infinite;
    }
    .spinner circle {
        opacity: .25;
    }
    .spinner path {
        opacity: .75;
    }
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>