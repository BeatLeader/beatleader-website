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
          rank: 1017,
          countryRank: 17,
          pp: 10367.2,
          country: "PL",
          role: "",
          badges: [],
          history: "928,929,931,934,938,938,940,946,949,959,955,960,962,962,950,953,952,953,960,956,958,960,960,962,965,965,968,970,971,964,965,971,972,974,982,983,985,987,994,996,998,1001,1005,1008,1009,1012,1018,1020,1020",
          permissions: 0,
          inactive: 0,
          banned: 0
      },
      scoreStats: {
        totalScore: 1960878152,
          totalRankedScore: 922482447,
          averageRankedAccuracy: 91.19754673952254,
          totalPlayCount: 2214,
          rankedPlayCount: 956
      },
      scores: {
        scores: [
          {
            rank: 326,
            scoreId: 55365653,
            score: 1168675,
            unmodififiedScore: 1168675,
            mods: "",
            pp: 348.312,
            weight: 0.22394798564968,
            timeSet: "2021-05-16T11:22:00.000Z",
            leaderboardId: 346606,
            songHash: "651F82B3849E4E37F7CFDDCD9209A4E506B2982E",
            songName: "AttraqtiA",
            songSubName: "",
            songAuthorName: "Camellia",
            levelAuthorName: "That_Narwhal",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1293635
          },
          {
            rank: 383,
            scoreId: 56005038,
            score: 1898906,
            unmodififiedScore: 1898906,
            mods: "",
            pp: 343.381,
            weight: 0.12221133473435,
            timeSet: "2021-05-16T10:49:44.000Z",
            leaderboardId: 349943,
            songHash: "FA6576F2CD906BA1A38C3AE887428C549299CDD6",
            songName: "!!!Chaos Time!!!",
            songSubName: "(Kobaryo's FTN-Remix)",
            songAuthorName: "t+pazolite",
            levelAuthorName: "Vilawes & Jabob",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 2163035
          },
          {
            rank: 317,
            scoreId: 57047298,
            score: 1073421,
            unmodififiedScore: 1073421,
            mods: "",
            pp: 292.629,
            weight: 0.000027261982609195,
            timeSet: "2021-05-16T10:35:27.000Z",
            leaderboardId: 347724,
            songHash: "0B71BA47DEEF78A55C5709058ABDB9B0849486F7",
            songName: "I",
            songSubName: "",
            songAuthorName: "Chroma",
            levelAuthorName: "Mystikmol & Moriik",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1253155
          },
          {
            rank: 485,
            scoreId: 57046995,
            score: 1999650,
            unmodififiedScore: 1999650,
            mods: "",
            pp: 340.002,
            weight: 0.076907122205181,
            timeSet: "2021-05-16T10:25:29.000Z",
            leaderboardId: 330234,
            songHash: "0F78A1408C91134E3B309E0BBA16B5AE914596F1",
            songName: "Melancholia",
            songSubName: "(EKU's Desolation Remix)",
            songAuthorName: "you",
            levelAuthorName: "abcbadq",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 2300115
          },
          {
            rank: 142,
            scoreId: 57046468,
            score: 1266213,
            unmodififiedScore: 1266213,
            mods: "",
            pp: 351.121,
            weight: 0.26761508715975,
            timeSet: "2021-05-16T10:08:14.000Z",
            leaderboardId: 351802,
            songHash: "BB6C14D91C6DAA1B31A44D54487231587E573D6F",
            songName: "Cthugha",
            songSubName: "",
            songAuthorName: "USAO",
            levelAuthorName: "Timbo",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1381035
          },
          {
            rank: 144,
            scoreId: 52528014,
            score: 1058923,
            unmodififiedScore: 1058923,
            mods: "",
            pp: 305.91,
            weight: 0.00026656884018725,
            timeSet: "2021-05-14T20:22:28.000Z",
            leaderboardId: 327949,
            songHash: "BDF85D5D575A992139EFF968A8348B3E6F03EEFE",
            songName: "Hellcat",
            songSubName: "",
            songAuthorName: "Desmeon",
            levelAuthorName: "CyanSnow",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1141835
          },
          {
            rank: 1095,
            scoreId: 55385780,
            score: 1595244,
            unmodififiedScore: 1595244,
            mods: "",
            pp: 274.842,
            weight: 0.0000024177686599896,
            timeSet: "2021-05-14T20:09:35.000Z",
            leaderboardId: 297695,
            songHash: "67935D25CAF0996A282E87AC7A21738812B629DD",
            songName: "Paranoid Mirage",
            songSubName: "",
            songAuthorName: "Kobaryo",
            levelAuthorName: "Soba`s",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 1924755
          },
          {
            rank: 43,
            scoreId: 56859947,
            score: 1784098,
            unmodififiedScore: 1784098,
            mods: "",
            pp: 0,
            weight: 0,
            timeSet: "2021-05-12T21:00:38.000Z",
            leaderboardId: 347585,
            songHash: "FE722346E322AE0A7BB35071EEFF78367F82AE5B",
            songName: "Shoulda Known Better",
            songSubName: "",
            songAuthorName: "DJ Noriken",
            levelAuthorName: "shrado & Fvrwvrd",
            difficulty: 9,
            difficultyRaw: "_ExpertPlus_SoloStandard",
            maxScore: 0
          }
        ]
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