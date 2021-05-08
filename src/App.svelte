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
      "playerInfo": {
        "playerId": "76561198035381239",
          "playerName": "motzel",
          "avatar": "/api/static/avatars/76561198035381239.jpg",
          "rank": 990,
          "countryRank": 17,
          "pp": 10362.9,
          "country": "PL",
          "role": "",
          "badges": [],
          "history": "897,900,904,907,912,913,918,923,921,924,927,928,929,931,934,938,938,940,946,949,959,955,960,962,962,950,953,952,953,960,956,958,960,960,962,965,965,968,970,971,964,965,971,972,974,982,983,985,987",
          "permissions": 0,
          "inactive": 0,
          "banned": 0
      },
        "scoreStats": {
        "totalScore": 1952058516,
          "totalRankedScore": 917761819,
          "averageRankedAccuracy": 91.17855235082183,
          "totalPlayCount": 2207,
          "rankedPlayCount": 952
      },
      scores: {
        "scores": [
          {
            "rank": 760,
            "scoreId": 40806669,
            "score": 1052237,
            "unmodififiedScore": 1052237,
            "mods": "",
            "pp": 358.512,
            "weight": 0.4732314292708,
            "timeSet": "2021-05-04T16:00:06.000Z",
            "leaderboardId": 191117,
            "songHash": "68B26B53BC3E1B5999770DB7B6C4358251717521",
            "songName": "Recollection",
            "songSubName": "",
            "songAuthorName": "Kobaryo",
            "levelAuthorName": "muffn & ExUnReal",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 1150115
          },
          {
            "rank": 560,
            "scoreId": 55315403,
            "score": 1892406,
            "unmodififiedScore": 1892406,
            "mods": "",
            "pp": 370.915,
            "weight": 0.65212036074823,
            "timeSet": "2021-05-04T15:47:06.000Z",
            "leaderboardId": 343563,
            "songHash": "A4DC5CE503BE7D3E42DD9F51995A341BCFF36B30",
            "songName": "Quicksand",
            "songSubName": "",
            "songAuthorName": "Camellia",
            "levelAuthorName": "Jabob, Narwhal, & Jez",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 2150155
          },
          {
            "rank": 18,
            "scoreId": 56458924,
            "score": 576946,
            "unmodififiedScore": 576946,
            "mods": "",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-04T15:41:50.000Z",
            "leaderboardId": 199991,
            "songHash": "D24E5A49FFB6EED74E39FDFEC3AB37218B82E512",
            "songName": "I Kissed A Girl",
            "songSubName": "",
            "songAuthorName": "Katy Perry",
            "levelAuthorName": "OnTheLooseWu",
            "difficulty": 7,
            "difficultyRaw": "_Expert_SoloStandard",
            "maxScore": 0
          },
          {
            "rank": 14,
            "scoreId": 55182794,
            "score": 605615,
            "unmodififiedScore": 605615,
            "mods": "",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-02T21:28:00.000Z",
            "leaderboardId": 346650,
            "songHash": "8FA5281A5DEDE13CABE5843BCE9517007AD8B04F",
            "songName": "2U",
            "songSubName": "(feat. Justin Bieber)",
            "songAuthorName": "David Guetta",
            "levelAuthorName": "Teuflum",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 0
          },
          {
            "rank": 206,
            "scoreId": 55729268,
            "score": 958027,
            "unmodififiedScore": 958027,
            "mods": "",
            "pp": 317.839,
            "weight": 0.0033447998495433,
            "timeSet": "2021-05-02T20:56:28.000Z",
            "leaderboardId": 348150,
            "songHash": "20003569447E4024720FD3FBB32CE5183EC06D31",
            "songName": "REANIMATE",
            "songSubName": "",
            "songAuthorName": "Warak",
            "levelAuthorName": "cerret & Nolanimations",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 1014875
          },
          {
            "rank": 61,
            "scoreId": 55907118,
            "score": 1321402,
            "unmodififiedScore": 1321402,
            "mods": "",
            "pp": 309.717,
            "weight": 0.00054357955720963,
            "timeSet": "2021-05-02T20:29:20.000Z",
            "leaderboardId": 350369,
            "songHash": "4BBDAA1004A00EEB9C8D9432640E1C7D490B46D9",
            "songName": "Party People",
            "songSubName": "",
            "songAuthorName": "Laur",
            "levelAuthorName": "Helloiamdaan & Nolanimations",
            "difficulty": 7,
            "difficultyRaw": "_Expert_SoloStandard",
            "maxScore": 1420595
          },
          {
            "rank": 175,
            "scoreId": 56375371,
            "score": 123617,
            "unmodififiedScore": 247234,
            "mods": "NF",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-02T20:21:21.000Z",
            "leaderboardId": 340346,
            "songHash": "2A229718B21633AEAE365786E6C41C3CAA3FDC2A",
            "songName": "National Tiles Ad",
            "songSubName": "",
            "songAuthorName": "Frank Walker",
            "levelAuthorName": "FatBeanzoop",
            "difficulty": 5,
            "difficultyRaw": "_Hard_SoloStandard",
            "maxScore": 0
          },
          {
            "rank": 134,
            "scoreId": 56375839,
            "score": 60548,
            "unmodififiedScore": 60548,
            "mods": "",
            "pp": 0,
            "weight": 0,
            "timeSet": "2021-05-02T20:17:59.000Z",
            "leaderboardId": 341033,
            "songHash": "38B6421ADFBD73AA1EB4879838FA8DC6D7E09E51",
            "songName": "She made BEANS",
            "songSubName": "",
            "songAuthorName": "Senior Bean",
            "levelAuthorName": "Jaydz",
            "difficulty": 9,
            "difficultyRaw": "_ExpertPlus_SoloStandard",
            "maxScore": 0
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