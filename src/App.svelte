<script>
  import PlayerPage from './pages/Player.svelte';

  const players = [
    {id: '76561198035381239', name: 'motzel'},
    {id: '76561198025451538', name: 'Drakonno'},
    {id: '76561198333869741', name: 'Cerret'},
  ];

  let initialPlayerId = players[0].id;
  let initialPlayerState = null;
    // {
    //   playerInfo: {
    //     playerId: "76561198035381239",
    //     playerName: "motzel",
    //     avatar: "/api/static/avatars/76561198035381239.jpg",
    //     rank: 958,
    //     countryRank: 16,
    //     pp: 10226.2,
    //     country: "PL",
    //     role: "",
    //     badges: [],
    //     history: "978,984,950,960,952,958,947,951,954,956,942,937,939,898,901,902,896,881,881,882,885,889,893,892,898,888,891,893,897,900,904,907,912,913,918,923,921,924,927,928,929,931,934,938,938,940,946,949,959",
    //     permissions: 0,
    //     inactive: 0,
    //     banned: 0,
    //   },
    //   scoreStats: {
    //     totalScore: 1865368299,
    //     totalRankedScore: 835589012,
    //     averageRankedAccuracy: 91.18827895986355,
    //     totalPlayCount: 2143,
    //     rankedPlayCount: 895,
    //   },
    //   scores: {scores:[
    //     {
    //       rank: 6,
    //       scoreId: 54710091,
    //       score: 1504730,
    //       unmodififiedScore: 1504730,
    //       mods: "",
    //       pp: 0,
    //       weight: 0,
    //       timeSet: "2021-04-03T20:41:11.000Z",
    //       leaderboardId: 341962,
    //       songHash: "D266446BE4EB5032A8548457B5A7035C20D59339",
    //       songName: "Recursion",
    //       songSubName: "",
    //       songAuthorName: "Vhure",
    //       levelAuthorName: "Savage",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 0,
    //     },
    //     {
    //       rank: 119,
    //       scoreId: 54708801,
    //       score: 354963,
    //       unmodififiedScore: 354963,
    //       mods: "",
    //       pp: 0,
    //       weight: 0,
    //       timeSet: "2021-04-03T20:22:42.000Z",
    //       leaderboardId: 343228,
    //       songHash: "5E51E3CAC6B1DC3376F776F6E6B961B754FF9CC4",
    //       songName: "Chapter 99: Afterword",
    //       songSubName: "",
    //       songAuthorName: "t+pazolite",
    //       levelAuthorName: "Emilia",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 0,
    //     }, {
    //       rank: 15,
    //       scoreId: 54708697,
    //       score: 947574,
    //       unmodififiedScore: 947574,
    //       mods: "",
    //       pp: 0,
    //       weight: 0,
    //       timeSet: "2021-04-03T20:16:39.000Z",
    //       leaderboardId: 344685,
    //       songHash: "12E3EC0E91CF5956ED61CD0C5BE4E484801F9618",
    //       songName: "Up & Down",
    //       songSubName: "",
    //       songAuthorName: "Marnik",
    //       levelAuthorName: "cat_using_a_toaster",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 0,
    //     }, {
    //       rank: 57,
    //       scoreId: 54708123,
    //       score: 871896,
    //       unmodififiedScore: 871896,
    //       mods: "",
    //       pp: 0,
    //       weight: 0,
    //       timeSet: "2021-04-03T20:10:57.000Z",
    //       leaderboardId: 344065,
    //       songHash: "247E7CD970F32FAFD9A14DE4904EE20EF19EA745",
    //       songName: "REANIMATE",
    //       songSubName: "",
    //       songAuthorName: "Warak",
    //       levelAuthorName: "epicmoo34 & TheWildDash",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 0,
    //     }, {
    //       rank: 205,
    //       scoreId: 49673077,
    //       score: 1714571,
    //       unmodififiedScore: 1714571,
    //       mods: "",
    //       pp: 0,
    //       weight: 0,
    //       timeSet: "2021-04-02T22:27:13.000Z",
    //       leaderboardId: 278696,
    //       songHash: "F1483AC9D5CED016CE70A84C14E34ADA36FBEE87",
    //       songName: "Automaton",
    //       songSubName: "",
    //       songAuthorName: "Laur",
    //       levelAuthorName: "cerret",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 0,
    //     }, {
    //       rank: 51,
    //       scoreId: 50240513,
    //       score: 972823,
    //       unmodififiedScore: 972823,
    //       mods: "",
    //       pp: 315.191,
    //       weight: 0.0087525111909217,
    //       timeSet: "2021-04-02T21:38:47.000Z",
    //       leaderboardId: 301847,
    //       songHash: "07B03E2F73C31ABEBBC43A2B2AC085720297CF85",
    //       songName: "Not Gonna Get Us",
    //       songSubName: "",
    //       songAuthorName: "t.A.T.u",
    //       levelAuthorName: "Emilia",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 1025915,
    //     }, {
    //       rank: 119,
    //       scoreId: 53807923,
    //       score: 1016714,
    //       unmodififiedScore: 1016714,
    //       mods: "",
    //       pp: 345.245,
    //       weight: 0.30860385037348,
    //       timeSet: "2021-04-02T20:47:53.000Z",
    //       leaderboardId: 331628,
    //       songHash: "F897EBEED22C678F9758EABEFB9E9C032A8E371C",
    //       songName: "Nana",
    //       songSubName: "",
    //       songAuthorName: "Geoxor",
    //       levelAuthorName: "Skeelie",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 1080195,
    //     }, {
    //       rank: 12,
    //       scoreId: 54641274,
    //       score: 1149940,
    //       unmodififiedScore: 1149940,
    //       mods: "",
    //       pp: 0,
    //       weight: 0,
    //       timeSet: "2021-04-02T20:38:08.000Z",
    //       leaderboardId: 344849,
    //       songHash: "D2D118D389AE0A27479E8A4910E4A71B2FAFF1C7",
    //       songName: "Your Voice So...",
    //       songSubName: "(android52 Remix) [feat.Such]",
    //       songAuthorName: "PSYQUI",
    //       levelAuthorName: "Meldi",
    //       difficulty: 9,
    //       difficultyRaw: "_ExpertPlus_SoloStandard",
    //       maxScore: 0,
    //     }]},
    //   scoresType: 'recent',
    // };

  let playerPageEl = null;

  async function changePlayer(newPlayerId) {
    if (!playerPageEl) return;

    initialPlayerState = null;
    playerPageEl.changePlayer(newPlayerId);
  }
</script>

<div class="section">
  <main>
    <div class="sspl-page-container">
<!--      <div>-->
<!--        Change player from outside of PlayerPage:-->
<!--        {#each players as player}-->
<!--        <button on:click={() => changePlayer(player.id)}>{player.name}</button>-->
<!--        {/each}-->
<!--      </div>-->

      <hr/>

      <PlayerPage bind:this={playerPageEl}
                  initialPlayerId={initialPlayerId}
                  initialState={initialPlayerState}
      />
    </div>
  </main>
</div>

<style>
    .section {
        padding: 1rem;
    }

    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>