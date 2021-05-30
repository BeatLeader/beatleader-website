<script>
  import PlayerPage from './pages/Player.svelte';

  const players = [
    {id: '76561198035381239', name: 'motzel'},
    {id: '76561198025451538', name: 'Drakonno'},
    {id: '76561198333869741', name: 'Cerret'},
  ];

  let initialPlayerId = players[0].id;
  let initialPlayerState =
    {
      playerInfo: {
        playerId: "76561198035381239",
        playerName: "motzel",
        avatar: "/api/static/avatars/76561198035381239.jpg",
        rank: 1051,
        countryRank: 17,
        pp: 10381,
        country: "PL",
        role: "",
        badges: [],
        history: "960,962,962,950,953,952,953,960,956,958,960,960,962,965,965,968,970,971,964,965,971,972,974,982,983,985,987,994,996,998,1001,1005,1008,1009,1012,1018,1020,1020,1022,1026,1031,1034,1031,1036,1042,1048,1050,1051,1053",
        permissions: 0,
        inactive: 0,
        banned: 0,
      },
      scoreStats: {
        totalScore: 1972610241,
        totalRankedScore: 927161437,
        averageRankedAccuracy: 91.18558148539192,
        totalPlayCount: 2222,
        rankedPlayCount: 960,
      },
      scores: {
        scores: [
          {
            rank: 1004,
            scoreId: 55385780,
            score: 1632407,
            unmodififiedScore: 1632407,
            mods: "",
            pp: 301.369,
            weight: 0.00010939367591426,
            timeSet: "2021-05-29T22:46:00.000Z",
            leaderboardId: 297695,
            songHash: "67935D25CAF0996A282E87AC7A21738812B629DD",
            songName: "Paranoid Mirage",
            songSubName: "",
            songAuthorName: "Kobaryo",
            levelAuthorName: "Soba`s",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1924755,
          },
          {
            rank: 248,
            scoreId: 57518567,
            score: 1836353,
            unmodififiedScore: 1836353,
            mods: "",
            pp: 373.249,
            weight: 0.70028227415311,
            timeSet: "2021-05-29T22:38:18.000Z",
            leaderboardId: 355157,
            songHash: "D9FA4E43AF8777116C60CFE2C473D13153754379",
            songName: "NOVAGROUND",
            songSubName: "",
            songAuthorName: "Quarks",
            levelAuthorName: "shrado & abcbadq",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 2027795,
          },
          {
            rank: 76,
            scoreId: 57628199,
            score: 1308466,
            unmodififiedScore: 1308466,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-29T22:25:18.000Z",
            leaderboardId: 357276,
            songHash: "A060F2B4D6E4157A28FCA33139205955A7A98847",
            songName: "Haunted Bus",
            songSubName: "",
            songAuthorName: "iFeature & ReeK",
            levelAuthorName: "Dexty, Atomo, & Jabob",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0,
          },
          {
            rank: 39,
            scoreId: 57628167,
            score: 1375123,
            unmodififiedScore: 1375123,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-29T22:20:21.000Z",
            leaderboardId: 358970,
            songHash: "BB4EC249AC3B07160B06DAA7ADADC194937A647E",
            songName: "Missing You",
            songSubName: "",
            songAuthorName: "MY FIRST STORY",
            levelAuthorName: "Nolanimations",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0,
          },
          {
            rank: 102,
            scoreId: 57628120,
            score: 2050468,
            unmodififiedScore: 2050468,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-29T22:13:37.000Z",
            leaderboardId: 357417,
            songHash: "BC8E2895E7A25A8F3FB0C87BF76C6EB09DC44E84",
            songName: "Endless Adventure",
            songSubName: "",
            songAuthorName: "Kobaryo",
            levelAuthorName: "Fvrwvrd",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0,
          },
          {
            rank: 934,
            scoreId: 53528645,
            score: 1235876,
            unmodififiedScore: 1235876,
            mods: "",
            pp: 338.925,
            weight: 0.062105554092115,
            timeSet: "2021-05-29T21:40:43.000Z",
            leaderboardId: 327911,
            songHash: "09F435B861416442FE61B5B2D512AFCA5C29BCF2",
            songName: "True Hero",
            songSubName: "",
            songAuthorName: "Kobaryo",
            levelAuthorName: "Cerret, Complex & Daan",
            difficulty: 5,
            difficultyRaw: "_Hard_SoloStandard",
            maxScore: 1427035,
          },
          {
            rank: 34,
            scoreId: 57518291,
            score: 2315567,
            unmodififiedScore: 2315567,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-29T20:57:32.000Z",
            leaderboardId: 355351,
            songHash: "F353A15AF20353EB4A05622D0CDFA48BD809223E",
            songName: "Gangnam Style",
            songSubName: "(Fvrwvrd's Genre-Fluid Remix)",
            songAuthorName: "PSY",
            levelAuthorName: "Maple Syrup",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0,
          },
          {
            rank: 51,
            scoreId: 56859947,
            score: 1784878,
            unmodififiedScore: 1784878,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-25T20:15:38.000Z",
            leaderboardId: 347585,
            songHash: "FE722346E322AE0A7BB35071EEFF78367F82AE5B",
            songName: "Shoulda Known Better",
            songSubName: "",
            songAuthorName: "DJ Noriken",
            levelAuthorName: "shrado & Fvrwvrd",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0,
          },
        ],
      },
      scoresType: 'recent',
    };


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
      <div>
        Test:
        {#each players as player}
        <button on:click={() => changePlayer(player.id)}>{player.name}</button>
        {/each}
      </div>

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

    @media (max-width: 400px) {
        .section {
            padding: .5rem 0;
        }
    }

    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>