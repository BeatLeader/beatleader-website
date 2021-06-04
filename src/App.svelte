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
        rank: 1040,
        countryRank: 17,
        pp: 10408.1,
        country: "PL",
        role: "",
        badges: [],
        history: "952,953,960,956,958,960,960,962,965,965,968,970,971,964,965,971,972,974,982,983,985,987,994,996,998,1001,1005,1008,1009,1012,1018,1020,1020,1022,1026,1031,1034,1031,1036,1042,1048,1050,1051,1053,1052,1047,1046,1047,1052",
        permissions: 0,
        inactive: 0,
        banned: 0,
      },
      scoreStats: {
        totalScore: 1981843620,
        totalRankedScore: 935936835,
        averageRankedAccuracy: 91.18285521138141,
        totalPlayCount: 2230,
        rankedPlayCount: 966,
      },
      scores: {
        scores: [
          {
            rank: 405,
            scoreId: 57651955,
            score: 899657,
            unmodififiedScore: 899657,
            mods: "",
            pp: 324.748,
            weight: 0.0078652877305842,
            timeSet: "2021-06-01T20:45:55.000Z",
            leaderboardId: 319746,
            songHash: "BCD465BC14CD421901CEC7869800AB977918E091",
            songName: "UMMU",
            songSubName: "",
            songAuthorName: "t+pazolite",
            levelAuthorName: "carrot",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1011195,
          },
          {
            rank: 187,
            scoreId: 49950112,
            score: 994026,
            unmodififiedScore: 994026,
            mods: "",
            pp: 349.819,
            weight: 0.22394798564968,
            timeSet: "2021-06-01T20:28:59.000Z",
            leaderboardId: 314010,
            songHash: "F6DC653A9FED9EEDF12C55163E508FDE404736B7",
            songName: "Ghost Family Living In Graveyard",
            songSubName: "",
            songAuthorName: "Roughsketch",
            levelAuthorName: "Helloiamdaan & miitchel",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1064555,
          },
          {
            rank: 734,
            scoreId: 49010154,
            score: 773836,
            unmodififiedScore: 773836,
            mods: "",
            pp: 346.453,
            weight: 0.15133786651887,
            timeSet: "2021-06-01T20:25:57.000Z",
            leaderboardId: 310950,
            songHash: "8B0954E826D02175872F9D80BF8BB96DE5A1B227",
            songName: "THE LAUNCH OF THE MEGANTO METEOR",
            songSubName: "",
            songAuthorName: "Camellia",
            levelAuthorName: "Kuurama & miitchel & ExUnReal",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 843755,
          },
          {
            rank: 292,
            scoreId: 50690470,
            score: 663891,
            unmodififiedScore: 663891,
            mods: "",
            pp: 291.186,
            weight: 0.000016555405523522,
            timeSet: "2021-06-01T20:05:52.000Z",
            leaderboardId: 302668,
            songHash: "91288CA5FCDA1AF6C36623EF260291F64FEEDA93",
            songName: "Dream of Winds",
            songSubName: "",
            songAuthorName: "XeoN",
            levelAuthorName: "Mystikmol",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 760035,
          },
          {
            rank: 10,
            scoreId: 48316806,
            score: 1055253,
            unmodififiedScore: 1055253,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-31T20:18:39.000Z",
            leaderboardId: 316162,
            songHash: "021541A8AB91C708724D5BDF28AF5E5C24213992",
            songName: "Yggdrasil",
            songSubName: "",
            songAuthorName: "Brothers of Metal",
            levelAuthorName: "Meldi",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0,
          },
          {
            rank: 101,
            scoreId: 57643521,
            score: 1506366,
            unmodififiedScore: 1506366,
            mods: "",
            pp: 278.575,
            weight: 0.0000031025840134428,
            timeSet: "2021-05-31T18:45:42.000Z",
            leaderboardId: 322171,
            songHash: "9F004C943E5CB3B007E93B148C6DA9ADF1280765",
            songName: "YELL!",
            songSubName: "feat. moimoi",
            songAuthorName: "DJ Genki VS Camellia",
            levelAuthorName: "Joshabi",
            difficulty: 7,
            difficultyRaw: "_Expert_SoloStandard",
            maxScore: 1599995,
          },
          {
            rank: 33,
            scoreId: 57518291,
            score: 2344396,
            unmodififiedScore: 2344396,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-30T18:12:24.000Z",
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
            rank: 20,
            scoreId: 57635265,
            score: 1706632,
            unmodififiedScore: 1706632,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-30T17:58:18.000Z",
            leaderboardId: 359236,
            songHash: "6423C4D623ED204905BC8DB569E6B1D5A76C141E",
            songName: "Get Gamered Up",
            songSubName: "(feat. DE125 & Lil Triangle) [Short Ver.]",
            songAuthorName: "Schwank",
            levelAuthorName: "ItsVasili",
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
        User test:
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

<footer>
  <p>ScoreSaber Reloaded by <a href="https://github.com/motzel">motzel</a></p>
  <p>
    Uses <a href="https://scoresaber.com">ScoreSaber API</a>,
    <a href="https://beatsaver.com">Beat Saver API</a>,
    <a href="https://www.beatsavior.io">Beat Savior API</a>.
  </p>
</footer>

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

    footer {
        margin-top: 1rem;
        font-size: .75em;
        text-align: center;
    }
</style>