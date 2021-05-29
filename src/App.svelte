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
        pp: 10369.8,
        country: "PL",
        role: "",
        badges: [],
        history: "955,960,962,962,950,953,952,953,960,956,958,960,960,962,965,965,968,970,971,964,965,971,972,974,982,983,985,987,994,996,998,1001,1005,1008,1009,1012,1018,1020,1020,1022,1026,1031,1034,1031,1036,1042,1048,1050,1051",
        permissions: 0,
        inactive: 0,
        banned: 0,
      },
      scoreStats: {
        totalScore: 1967744244,
        totalRankedScore: 927047581,
        averageRankedAccuracy: 91.1787350469713,
        totalPlayCount: 2219,
        rankedPlayCount: 960,
      },
      scores: {
        scores: [
          {
            "rank": 51,
            "scoreId": 56859947,
            "score": 1784878,
            "unmodififiedScore": 1784878,
            "mods": "",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-25T20:15:38.000Z",
            "leaderboardId": 347585,
            "songHash": "FE722346E322AE0A7BB35071EEFF78367F82AE5B",
            "songName": "Shoulda Known Better",
            "songSubName": "",
            "songAuthorName": "DJ Noriken",
            "levelAuthorName": "shrado & Fvrwvrd",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 0,
          },
          {
            "rank": 277,
            "scoreId": 55729268,
            "score": 958128,
            "unmodififiedScore": 958128,
            "mods": "",
            "pp": 317.93,
            "weight": 0.0029005435356175,
            "timeSet": "2021-05-25T19:34:32.000Z",
            "leaderboardId": 348150,
            "songHash": "20003569447E4024720FD3FBB32CE5183EC06D31",
            "songName": "REANIMATE",
            "songSubName": "",
            "songAuthorName": "Warak",
            "levelAuthorName": "cerret & Nolanimations",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 1014875,
          },
          {
            "rank": 378,
            "scoreId": 57519680,
            "score": 1029620,
            "unmodififiedScore": 1029620,
            "mods": "",
            "pp": 279.203,
            "weight": 0.0000039813683251699,
            "timeSet": "2021-05-25T19:15:15.000Z",
            "leaderboardId": 355921,
            "songHash": "4636E2C0FBCC6C118EDF6FDE61EF07EAA87EEEDF",
            "songName": "Yubi Breaker",
            "songSubName": "(from TANOCCA) [Level 3]",
            "songAuthorName": "ReeK",
            "levelAuthorName": "Jabob",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 1233835,
          },
          {
            "rank": 551,
            "scoreId": 57519217,
            "score": 1034067,
            "unmodififiedScore": 1034067,
            "mods": "",
            "pp": 228.022,
            "weight": 2.1929064511522e-8,
            "timeSet": "2021-05-25T19:05:25.000Z",
            "leaderboardId": 355707,
            "songHash": "85ED6A233B87576D8A101927AB4AC10B6A0B74F4",
            "songName": "northern_limit",
            "songSubName": "feat. Sennzai",
            "songAuthorName": "Kobaryo",
            "levelAuthorName": "Emilia",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 1305595,
          },
          {
            "rank": 297,
            "scoreId": 57518567,
            "score": 1801070,
            "unmodififiedScore": 1801070,
            "mods": "",
            "pp": 352.277,
            "weight": 0.28737962056404,
            "timeSet": "2021-05-25T18:51:22.000Z",
            "leaderboardId": 355157,
            "songHash": "D9FA4E43AF8777116C60CFE2C473D13153754379",
            "songName": "NOVAGROUND",
            "songSubName": "",
            "songAuthorName": "Quarks",
            "levelAuthorName": "shrado & abcbadq",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 2027795,
          },
          {
            "rank": 36,
            "scoreId": 57518291,
            "score": 2297483,
            "unmodififiedScore": 2297483,
            "mods": "",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-25T18:45:32.000Z",
            "leaderboardId": 355351,
            "songHash": "F353A15AF20353EB4A05622D0CDFA48BD809223E",
            "songName": "Gangnam Style",
            "songSubName": "(Fvrwvrd's Genre-Fluid Remix)",
            "songAuthorName": "PSY",
            "levelAuthorName": "Maple Syrup",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 0,
          },
          {
            "rank": 138,
            "scoreId": 57516715,
            "score": 700276,
            "unmodififiedScore": 700276,
            "mods": "",
            "pp": 164.387,
            "weight": 1.2970395728941e-10,
            "timeSet": "2021-05-25T18:12:26.000Z",
            "leaderboardId": 350368,
            "songHash": "4BBDAA1004A00EEB9C8D9432640E1C7D490B46D9",
            "songName": "Party People",
            "songSubName": "",
            "songAuthorName": "Laur",
            "levelAuthorName": "Helloiamdaan & Nolanimations",
            "difficulty": 5,
            "difficultyRaw": "_Hard_SoloStandard",
            "maxScore": 735195,
          },
          {
            "rank": 270,
            "scoreId": 37052893,
            "score": 1650994,
            "unmodififiedScore": 1650994,
            "mods": "",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-23T09:45:58.000Z",
            "leaderboardId": 242528,
            "songHash": "2C388532C027B389EC1CD0A0C06D94C4B21D860B",
            "songName": "TRICKL4SH 220",
            "songSubName": "",
            "songAuthorName": "Lite Show Magic",
            "levelAuthorName": "cerret",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 0,
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