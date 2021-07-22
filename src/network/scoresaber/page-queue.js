import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../utils/format'
import {extractDiffAndType} from '../../utils/scoresaber/format'
import cfDecryptEmail from '../../utils/cf-email-decrypt'
import {capitalize, getFirstRegexpMatch, opt} from '../../utils/js'
import {dateFromString} from '../../utils/date'
import {SCORES_PER_PAGE} from '../../utils/scoresaber/consts'

export const SS_HOST = 'https://scoresaber.com';
const SS_CORS_HOST = '/cors/score-saber';
const RANKEDS_URL = SS_CORS_HOST + '/api.php?function=get-leaderboards&cat=1&limit=5000&ranked=1&page=${page}';
const PLAYER_PROFILE_URL = SS_CORS_HOST + '/u/${playerId}?page=1&sort=2'
const COUNTRY_RANKING_URL = SS_CORS_HOST + '/global/${page}?country=${country}'
const LEADERBOARD_URL = SS_CORS_HOST + '/leaderboard/${leaderboardId}?page=${page}'

export const parseSsInt = text => {
  const value = getFirstRegexpMatch(/(-?[0-9,]+)\s*$/, text)
  return value ? parseInt(value.replace(/[^\d-]/g, '') , 10) : null;
}
export const parseSsFloat = text => text ? parseFloat(getFirstRegexpMatch(/([0-9,.]+)\s*$/, text.replace(/[^\d.]/g, ''))) : null;

export default (options = {}) => {
  const queue = createQueue(options);

  const {fetchJson, fetchHtml, ...queueToReturn} = queue;

  const processRankeds = data => {
    if (!data || !data.songs || !Array.isArray(data.songs)) return null;

    return data.songs.map(s => {
      const {
        uid: leaderboardId,
        id: hash,
        name,
        songSubName: subName,
        songAuthorName: authorName,
        levelAuthorName,
        stars,
        image: imageUrl,
        diff
      } = s;

      const diffInfo = extractDiffAndType(diff);

      return {leaderboardId, hash, name, subName, authorName, levelAuthorName, imageUrl, stars, diff, diffInfo};
    })
  }

  const getImgUrl = imgUrl => {
    try {
      const aUrl = new URL(imgUrl);
      return SS_HOST + aUrl.pathname;
    }
    catch(err) {
      return null;
    }
  }

  const rankeds = async (page = 1, signal = null, priority = PRIORITY.BG_NORMAL) => fetchJson(substituteVars(RANKEDS_URL, {page}), {signal}, priority)
    .then(r => r.body)
    .then(data => processRankeds(data));

  const processPlayerProfile = (playerId, doc) => {
    cfDecryptEmail(doc);

    let avatar = getImgUrl(opt(doc.querySelector('.column.avatar img'), 'src', null));

    let playerName = opt(doc.querySelector('.content .column:not(.avatar) .title a'), 'innerText');
    playerName = playerName ? playerName.trim() : null;

    let country = getFirstRegexpMatch(/^.*?\/flags\/([^.]+)\..*$/, opt(doc.querySelector('.content .column .title img'), 'src'));
    country = country ? country.toUpperCase() : null;

    let pageNum = parseSsInt(opt(doc.querySelector('.pagination .pagination-list li a.is-current'), 'innerText', null));
    pageNum = !isNaN(pageNum) ? pageNum : null

    let pageQty = parseSsInt(opt(doc.querySelector('.pagination .pagination-list li:last-of-type'), 'innerText', null));
    pageQty = !isNaN(pageQty) ? pageQty : null

    let totalItems = parseSsFloat(getFirstRegexpMatch(/^\s*<strong>(?:[^:]+)\s*:?\s*<\/strong>\s*(.*)$/, opt(doc.querySelector('.columns .column:not(.is-narrow) ul li:nth-of-type(3)'), 'innerHTML')))
    totalItems = !isNaN(totalItems) ? totalItems : 0;

    let playerRank = parseSsInt(opt(doc.querySelector('.content .column ul li:first-of-type a:first-of-type'), 'innerText'));
    playerRank = !isNaN(playerRank) ? playerRank : null;

    let countryRank = parseSsInt(opt(doc.querySelector('.content .column ul li:first-of-type a[href^="/global?country="]'), 'innerText'))
    countryRank = !isNaN(countryRank) ? countryRank : null;

    const stats = [{key: 'Player ranking', type: 'rank', value: playerRank, countryRank: countryRank}]
      .concat(
        [...doc.querySelectorAll('.content .column ul li')]
          .map(li => {
            const matches = li.innerHTML.match(/^\s*<strong>([^:]+)\s*:?\s*<\/strong>\s*(.*)$/);
            if (!matches) return null;

            const mapping = [
              {key: 'Performance Points', type: 'number', precision: 2, suffix: 'pp', number: true,},
              {key: 'Play Count', type: 'number', precision: 0, number: true, colorVar: 'selected',},
              {key: 'Total Score', type: 'number', precision: 0, number: true, colorVar: 'selected',},
              {
                key: 'Replays Watched by Others',
                type: 'number',
                precision: 0,
                title: 'profile.stats.replays',
                number: true,
                colorVar: 'dimmed',
              },
              {key: 'Role', number: false, colorVar: 'dimmed'},
              {key: 'Inactive Account', number: false, colorVar: 'decrease'},
              {key: 'Banned', number: false, colorVar: 'decrease'},
            ];

            const value = mapping.filter(m => m.number).map(m => m.key).includes(matches[1])
              ? parseSsFloat(matches[2])
              : matches[2];

            const item = mapping.find(m => m.key === matches[1]);
            return item ? {...item, value} : {label: matches[1], value};
          })
          .filter(s => s)
      ).reduce((cum, item) => {
        if (item.key)
          switch (item.key) {
            case 'Player ranking':
              cum.rank = item.value;
              cum.countryRank = item.countryRank;
              break;

            case 'Performance Points':
              cum.pp = item.value;
              break;
            case 'Play Count':
              cum.playCount = item.value;
              break;
            case 'Total Score':
              cum.totalScore = item.value;
              break;
            case 'Replays Watched by Others':
              cum.replays = item.value;
              break;
            case 'Role':
              cum.role = item.value;
              break;
            case 'Inactive Account':
              cum.inactiveAccount = true;
              break;
            case 'Banned':
              cum.bannedAccount = true;
              break;
          }

        return cum;
      }, {inactiveAccount: false, bannedAccount: false});

    const scores = [...doc.querySelectorAll('table.ranking tbody tr')].map(tr => {
      let ret = {lastUpdated: new Date()};

      const rank = tr.querySelector('th.rank');
      if (rank) {
        const rankMatch = parseSsInt(rank.innerText);
        ret.rank = !isNaN(rankMatch) ? rankMatch : null;
      } else {
        ret.rank = null;
      }

      const song = tr.querySelector('th.song a');
      if (song) {
        const leaderboardId = parseInt(getFirstRegexpMatch(/leaderboard\/(\d+)/, song.href), 10);
        ret.leaderboardId = leaderboardId ? leaderboardId : null;
      } else {
        ret.leaderboardId = null;
      }

      const img = tr.querySelector('th.song img');
      const imgMatch = img ? img.src.match(/([^\/]+)\.(jpg|jpeg|png)$/) : null;
      ret.songHash = imgMatch ? imgMatch[1] : null;

      const songPp = tr.querySelector('th.song a .songTop.pp');
      const songMatch = songPp
        ? songPp.innerHTML
          .replace(/&amp;/g, '&')
          .replace(/<span class="__cf_email__" data-cfemail="[^"]+">\[email&nbsp;protected]<\/span>/g, '')
          .match(/^(.*?)\s*<span[^>]+>(.*?)<\/span>/)
        : null;
      if (songMatch) {
        const songAuthorMatch = songMatch[1].match(/^(.*?)\s-\s(.*)$/);
        if (songAuthorMatch) {
          ret.songName = songAuthorMatch[2];
          ret.songSubName = '';
          ret.songAuthorName = songAuthorMatch[1];
        } else {
          ret.songName = songMatch[1];
          ret.songSubName = '';
          ret.songAuthorName = '';
        }
        ret.difficultyRaw = '_' + songMatch[2].replace('Expert+', 'ExpertPlus') + '_SoloStandard'
      } else {
        ret = Object.assign(ret, {songName: null, songSubName: null, songAuthorName: null, difficultyRaw: null});
      }

      const songMapper = tr.querySelector('th.song a .songTop.mapper');
      ret.levelAuthorName = songMapper ? songMapper.innerText : null;

      const songDate = tr.querySelector('th.song span.songBottom.time');
      ret.timeSet = songDate ? dateFromString(songDate.title) : null;

      const pp = parseSsFloat(opt(tr.querySelector('th.score .scoreTop.ppValue'), 'innerText'));
      ret.pp = !isNaN(pp) ? pp : null;

      const ppWeighted = parseSsFloat(getFirstRegexpMatch(/^\(([0-9.]+)pp\)$/, opt(tr.querySelector('th.score .scoreTop.ppWeightedValue'), 'innerText')));
      ret.ppWeighted = !isNaN(ppWeighted) ? ppWeighted : null;

      const scoreInfo = tr.querySelector('th.score .scoreBottom');
      const scoreInfoMatch = scoreInfo ? scoreInfo.innerText.match(/^([^:]+):\s*([0-9,.]+)(?:.*?\((.*?)\))?/) : null;
      if (scoreInfoMatch) {
        switch (scoreInfoMatch[1]) {
          case "score":
            ret.acc = null;
            ret.mods = scoreInfoMatch[3] ? scoreInfoMatch[3] : "";
            ret.score = parseSsFloat(scoreInfoMatch[2]);
            break;

          case "accuracy":
            ret.score = null;
            ret.mods = scoreInfoMatch[3] ? scoreInfoMatch[3] : "";
            ret.acc = parseSsFloat(scoreInfoMatch[2]);
            break;
        }
      }

      return ret;
    });
    const recentPlay = scores && scores.length && scores[0].timeSet ? scores[0].timeSet : null;

    return {
      player: {
        playerInfo: {
          playerId,
          playerName,
          avatar,
          externalProfileUrl: opt(doc.querySelector('.content .column:not(.avatar) .title a'), 'href', null),
          history: getFirstRegexpMatch(/data:\s*\[([0-9,]+)\]/, doc.body.innerHTML),
          country,
          badges: [...doc.querySelectorAll('.column.avatar center img')].map(img => ({
            image: getImgUrl(img.src),
            description: img.title
          })),
          rank: stats.rank ? stats.rank : null,
          countryRank: stats.countryRank ? stats.countryRank : null,
          pp: stats.pp !== undefined ? stats.pp : null,
          inactive: stats.inactiveAccount ? 1 : 0,
          banned: stats.bannedAccount ? 1 : 0,
          role: '',
        },
        scoreStats: {
          totalScore: stats.totalScore ? stats.totalScore : 0,
          totalPlayCount: stats.playCount ? stats.playCount : 0,
          replays: stats.replays ? stats.replays : null,
        },
        recentPlay,
        recentPlayLastUpdated: recentPlay ? new Date() : null,
      },
      scores,
      others: {
        pageNum,
        pageQty,
        totalItems,
      }
    };
  }

  const player = async (playerId, signal = null, priority = PRIORITY.FG_LOW) => fetchHtml(substituteVars(PLAYER_PROFILE_URL, {playerId}), {signal}, priority)
    .then(r => r.body)
    .then(doc => processPlayerProfile(playerId, doc));

  const processCountryRanking = (country, doc) => {
    cfDecryptEmail(doc);

    const data = [...doc.querySelectorAll('.ranking.global .player a')]
      .map(a => {
        const tr = a.closest("tr");
        const id = getFirstRegexpMatch(/\/(\d+)$/, a.href)

        const avatar = getImgUrl(opt(tr.querySelector('td.picture img'), 'src', null));

        let country = getFirstRegexpMatch(/^.*?\/flags\/([^.]+)\..*$/, opt(tr.querySelector('td.player img'), 'src', null));
        country = country ? country.toUpperCase() : null;

        let difference = parseSsInt(opt(tr.querySelector('td.diff'), 'innerText', null));
        difference = !isNaN(difference) ? difference : null

        let playerName = opt(a.querySelector('.songTop.pp'), 'innerText');
        playerName = playerName ? playerName.trim() : null;

        let pp = parseSsFloat(opt(tr.querySelector('td.pp .scoreTop.ppValue'), 'innerText'));
        pp = !isNaN(pp) ? pp : null;

        let rank = parseSsInt(getFirstRegexpMatch(/^\s*#(\d+)\s*$/, opt(tr.querySelector('td.rank'), 'innerText', null)));
        rank = !isNaN(rank) ? rank : null

        return {
          avatar,
          country,
          difference,
          history: [],
          playerId: id,
          playerName,
          pp,
          rank,
        }
      })

    return {players: data};
  }

  const countryRanking = async (country, page = 1, signal = null, priority = PRIORITY.FG_LOW) => fetchHtml(substituteVars(COUNTRY_RANKING_URL, {country, page}), {signal}, priority)
    .then(r => r.body)
    .then(doc => processCountryRanking(country, doc));

  const parseSsLeaderboardScores = doc => {
    cfDecryptEmail(doc);

    return [...doc.querySelectorAll('table.ranking tbody tr')].map(tr => {
      let ret = {lastUpdated: new Date()};

      const parseValue = selector => {
        const val = parseSsFloat(opt(tr.querySelector(selector), 'innerText'));

        return !isNaN(val) ? val : null;
      }

      ret.picture = getImgUrl(opt(tr.querySelector('.picture img'), 'src', null));

      ret.rank = parseSsInt(opt(tr.querySelector('td.rank'), 'innerText'));
      if (isNaN(ret.rank)) ret.rank = null;

      const player = tr.querySelector('.player a');
      if (player) {
        ret.country = getFirstRegexpMatch(/^.*?\/flags\/([^.]+)\..*$/, opt(player.querySelector('img'), 'src', ''));
        ret.country = ret.country ? ret.country.toUpperCase() : null;

        ret.playerName = opt(player.querySelector('span.songTop.pp'), 'innerText')
        ret.playerName = ret.playerName ? ret.playerName.trim().replace('&#039;', "'") : null;
        ret.playerId = getFirstRegexpMatch(/\/u\/(\d+)((\?|&|#).*)?$/, opt(player, 'href', ''));
        ret.playerId = ret.playerId ? ret.playerId.trim() : null;
      } else {
        ret.country = null;
        ret.playerId = null;
        ret.playerName = null;
      }

      ret.score = parseValue('td.score');

      ret.timeSetString = opt(tr.querySelector('td.timeset'), 'innerText', null);
      if (ret.timeSetString) ret.timeSetString = ret.timeSetString.trim();

      ret.mods = opt(tr.querySelector('td.mods'), 'innerText')
      ret.mods = ret.mods ? ret.mods.replace('-','').split(',').filter(m => m && m.trim().length).join(',') : null;

      ret.pp = parseValue('td.pp .scoreTop.ppValue');

      ret.percentage = parseValue('td.percentage');

      return ret;
    });
  }

  const processLeaderboard = (leaderboardId, doc) => {
    cfDecryptEmail(doc);

    const diffs = [...doc.querySelectorAll('.tabs ul li a')].map(a => {
      let leaderboardId = parseInt(getFirstRegexpMatch(/leaderboard\/(\d+)$/, a.href), 10);
      if (isNaN(leaderboardId)) leaderboardId = null;

      const span = a.querySelector('span');
      const color = span ? span.style.color : null;

      return {name: a.innerText, leaderboardId, color};
    });

    const currentDiffHuman = opt(doc.querySelector('.tabs li.is-active a span'), 'innerText', null);

    let diff = null;
    let diffInfo = null;
    if (currentDiffHuman) {
      const lowerCaseDiff = currentDiffHuman.toLowerCase().replace('+', 'Plus');
      diff = `_${capitalize(lowerCaseDiff)}_SoloStandard`;
      diffInfo = {type: 'Standard', diff: lowerCaseDiff}
    }

    const songName = opt(doc.querySelector('.column.is-one-third-desktop .box:first-of-type .title a'), 'innerText', null);

    const imageUrl = getImgUrl(opt(doc.querySelector('.column.is-one-third-desktop .box:first-of-type .columns .column.is-one-quarter img'), 'src', null));

    const songInfo = [
      {id: 'hash', label: 'ID', value: null},
      {id: 'scores', label: 'Scores', value: null},
      {id: 'status', label: 'Status', value: null},
      {id: 'totalScores', label: 'Total Scores', value: null},
      {id: 'noteCount', label: 'Note Count', value: null},
      {id: 'bpm', label: 'BPM', value: null},
      {id: 'stars', label: 'Star Difficulty', value: null},
      {id: 'levelAuthorName', label: 'Mapped by', value: null},
    ]
      .map(sid => {
        let songInfoBox = doc.querySelector('.column.is-one-third-desktop .box:first-of-type')
        return {
          ...sid,
          value: songInfoBox ? songInfoBox.innerHTML.match(new RegExp(sid.label + ':\\s*<b>(.*?)</b>', 'i')) : null,
        }
      })
      .concat([{id: 'name', value: [null, songName]}])
      .reduce((cum, sid) => {
        let value = Array.isArray(sid.value) ? sid.value[1] : null;

        if (value !== null && ['scores', 'totalScores', 'bpm', 'noteCount'].includes(sid.id)) {
          value = parseSsFloat(value);

          if (value !== null) {
            cum.stats[sid.id] = value;
          }

          return cum;
        }
        if (value !== null && sid.id === 'stars') value = parseSsFloat(value);
        if (value && sid.id === 'name') {
          const songAuthorMatch = value.match(/^(.*?)\s-\s(.*)$/);
          if (songAuthorMatch) {
            value = songAuthorMatch[2];
            cum.authorName = songAuthorMatch[1];
          } else {
            cum.authorName = '';
          }
          cum.subName = '';
        }
        if (value && sid.id === 'levelAuthorName') {
          const el = doc.createElement('div');
          el.innerHTML = value;
          value = el.innerText;
        }
        if (value && sid.id === 'status') {
          cum.stats[sid.id] = value;
          return cum;
        }
        if (value !== null) cum[sid.id] = value;

        return cum;
      }, {diff, diffInfo, imageUrl, leaderboardId, stats: {}});

    const {stats, ...song} = songInfo;

    let pageQty = parseInt(opt(doc.querySelector('.pagination .pagination-list li:last-of-type'), 'innerText', null), 10)
    if (isNaN(pageQty)) pageQty = null;

    let scoresQty = opt(stats, 'scores', 0);
    if (isNaN(scoresQty)) scoresQty = null;

    const totalItems = pageQty && scoresQty ? (Math.ceil(scoresQty / SCORES_PER_PAGE) > pageQty ? pageQty * SCORES_PER_PAGE : scoresQty) : null;

    let pageNum = parseInt(opt(doc.querySelector('.pagination .pagination-list li a.is-current'), 'innerText', null), 10);
    if (isNaN(pageNum)) pageNum = null;

    let diffChartText = getFirstRegexpMatch(/'difficulty',\s*([0-9.,\s]+)\s*\]/, doc.body.innerHTML)
    let diffChart = (diffChartText ? diffChartText : '').split(',').map(i => parseFloat(i)).filter(i => i && !isNaN(i));

    return {
      diffs,
      song,
      stats,
      diffChart,
      pageNum,
      pageQty,
      totalItems,
      scores: parseSsLeaderboardScores(doc),
    }
  }

  // TODO: remove mock
  const leaderboard = async (leaderboardId, page = 1, signal = null, priority = PRIORITY.FG_LOW) => {
    const doc = `
<!DOCTYPE html>
<html lang="en">
\t<head>
\t\t<meta property="og:image" content="https://scoresaber.com/imports/images/songs/DD868B8675B3366C37C91305336CD1793E8FC093.png" />
\t\t<meta property="og:image:secure_url" content="https://scoresaber.com/imports/images/songs/DD868B8675B3366C37C91305336CD1793E8FC093.png" />
\t\t<meta property="og:title" content="Imil &amp; m1dlet - Bailandorape by Emilia" />
\t\t<meta
\t\t\tproperty="og:description"
\t\t\tcontent="Status: Ranked
  Stars: 10.59★
  Scores: 530
  Total Scores: 1,757"
\t\t/>
\t\t<meta property="og:type" content="website" />
\t\t<meta property="og:url" content="https://scoresaber.com/leaderboard/359156" />
\t\t<meta property="og:site_name" content="ScoreSaber" />

\t\t<meta charset="utf-8" />
\t\t<link rel="shortcut icon" href="https://scoresaber.com/imports/images/logo.ico" />
\t\t<link rel="stylesheet" href="/imports/css/bulma.css" />
\t\t<link rel="stylesheet" href="/imports/css/scoresaber.css" />
\t\t<link rel="stylesheet" href="/imports/css/leaderboards.css" />

\t\t<link rel="stylesheet" href="/imports/css/c3.min.css" />
\t\t<link
\t\t\trel="stylesheet"
\t\t\thref="https://use.fontawesome.com/releases/v5.3.1/css/all.css"
\t\t\tintegrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU"
\t\t\tcrossorigin="anonymous"
\t\t/>
\t\t<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
\t\t<title>Scores for Imil &amp; m1dlet - Bailandorape</title>
\t</head>

\t<body>
\t\t<script src="/imports/js/jquery.js"></script>
\t\t<nav class="navbar has-shadow is-fixed-top" aria-label="main navigation">
\t\t\t<div class="container">
\t\t\t\t<div class="navbar-brand">
\t\t\t\t\t<a class="navbar-item" href="https://scoresaber.com/">
\t\t\t\t\t\t<img src="/imports/images/ScoreSaberLogo.svg" style="width: 28px; height: 28px; margin-top: 2px; margin-right: 7px;" />
\t\t\t\t\t\t<b>Score Saber</b>
\t\t\t\t\t</a>
\t\t\t\t\t<a role="button" class="navbar-burger" data-target="navMenu" aria-label="menu" aria-expanded="false">
\t\t\t\t\t\t<span aria-hidden="true"></span>
\t\t\t\t\t\t<span aria-hidden="true"></span>
\t\t\t\t\t\t<span aria-hidden="true"></span>
\t\t\t\t\t</a>
\t\t\t\t</div>
\t\t\t\t<div class="navbar-menu" id="navMenu">
\t\t\t\t\t<div class="navbar-start">
\t\t\t\t\t\t<a class="navbar-item" href="https://scoresaber.com/global">
\t\t\t\t\t\t\tGlobal Ranking
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<a class="navbar-item" href="https://scoresaber.com/faq">
\t\t\t\t\t\t\tFAQ & External Links
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<a class="navbar-item" href="https://new.scoresaber.com/ranking/requests">
\t\t\t\t\t\t\tView Rank Requests
\t\t\t\t\t\t</a>
\t\t\t\t\t</div>

\t\t\t\t\t<div class="navbar-end">
\t\t\t\t\t\t<a class="navbar-item discord" target="_blank" href="https://discord.gg/WpuDMwU">
\t\t\t\t\t\t\t<i class="fab fa-discord fa-2x" title="Join the ScoreSaber Discord!"></i>
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<a class="navbar-item twitter" target="_blank" href="https://twitter.com/ScoreSaber">
\t\t\t\t\t\t\t<i class="fab fa-twitter fa-2x" title="Follow us on Twitter for updates!"></i>
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<a class="navbar-item donate" target="_blank" href="https://www.patreon.com/scoresaber">
\t\t\t\t\t\t\t<i class="fab fa-gratipay fa-2x" title="Support us on Patreon!"></i>
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<a class="navbar-item tshirt" target="_blank" href="https://scoresaber.store/">
\t\t\t\t\t\t\t<i class="fas fa-tshirt fa-2x" title="Merch"></i>
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<form class="field has-addons navbar-item" action="/leaderboard/359156" method="GET">
\t\t\t\t\t\t\t<div class="control is-expanded">
\t\t\t\t\t\t\t\t<input class="input" size="35" name="search" value="" type="search" placeholder="Search username" aria-label="Search" />
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="control">
\t\t\t\t\t\t\t\t<button class="button is-dark has-background-grey-dark" type="submit">Search</button>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</form>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</nav>
\t\t<div class="section" style="margin-top: 50px;">
\t\t\t<div class="container">
\t\t\t\t<div class="content">
\t\t\t\t\t<div class="columns is-desktop is-flex-reverse">
\t\t\t\t\t\t<div class="column is-one-third-desktop">
\t\t\t\t\t\t\t<div class="box has-shadow">
\t\t\t\t\t\t\t\t<h4 class="title is-5">
\t\t\t\t\t\t\t\t\t<a href="https://scoresaber.com/?search=Imil &amp; m1dlet">Imil &amp; m1dlet - Bailandorape</a>
\t\t\t\t\t\t\t\t\t<hr />
\t\t\t\t\t\t\t\t</h4>
\t\t\t\t\t\t\t\t<div class="columns">
\t\t\t\t\t\t\t\t\t<div class="column is-one-quarter">
\t\t\t\t\t\t\t\t\t\t<img src="https://scoresaber.com/imports/images/songs/DD868B8675B3366C37C91305336CD1793E8FC093.png" style="border-radius: 15%; width: 64px; height: 64px;" />
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div class="column" style="padding: 6px;">
\t\t\t\t\t\t\t\t\t\tMapped by: <b><a href="https://scoresaber.com/?search=Emilia">Emilia</a></b
\t\t\t\t\t\t\t\t\t\t><br />
\t\t\t\t\t\t\t\t\t\tStatus: <b>Ranked</b><br />
\t\t\t\t\t\t\t\t\t\tScores: <b>530</b><br />
\t\t\t\t\t\t\t\t\t\tTotal Scores: <b>1,757</b>

\t\t\t\t\t\t\t\t\t\t<hr style="margin: 1.5rem 0; margin-top: 0.5rem; margin-right: 0px; margin-bottom: 0.5rem; margin-left: 0px;" />
\t\t\t\t\t\t\t\t\t\tStar Difficulty: <b>10.59★</b><br />
\t\t\t\t\t\t\t\t\t\tNote Count: <b>1,853</b><br />
\t\t\t\t\t\t\t\t\t\tBPM: <b>300</b><br />
\t\t\t\t\t\t\t\t\t\t 
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t<hr />
\t\t\t\t\t\t\t\t \t\t\t\t\t\t\t\t<br />ID: <b>DD868B8675B3366C37C91305336CD1793E8FC093</b><br />
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t
            <div class="box has-shadow">
                <h4 class="title is-4">
                    Difficulty Graph<hr
                </h4>
                <div id="chart"></div>
                <script>
                    $(document).ready(function() {
                        var chart = c3.generate({
                            bindto: '#chart',
                            zoom: {
                                enabled: true
                            },

                            data: {
                                columns: [
                                    ['difficulty', 129.987630227249, 121.431014670598, 118.542136047728, 203.964866168767, 228.906602852235, 240.960444731566, 213.062288572286, 180.337999342038, 90.0032991461373, 171.298573567693, 190.917611160183, 207.404676120125, 203.860758229249, 251.253114336536, 208.681264417247, 236.348957618583, 129.632511211356, 140.664818684767, 146.239433350293, 264.844629176865, 184.007581393354, 201.511800420109, 233.983685685161, 250.993195787933, 348.806549802467, 212.631145812517, 324.0587905791, 118.416800057075, 113.743399631281, 104.354535897034, 9.72861548359032, ]
                                ]
                            },
                            
\t\t\tonrendered: function() {
\t\t\t\td3.selectAll(".c3-axis.c3-axis-x, .c3-axis.c3-axis-y .tick text")
\t\t\t\t\t\t.style("display", "none");
\t\t\t},
\t\t\ttooltip: {
\t\t\t\tshow: false
\t\t\t}
\t\t\t
                        });
                    });
                </script>
            </div>
\t\t\t
\t\t\t\t\t\t</div>

\t\t\t\t\t\t<div class="column">
\t\t\t\t\t\t\t<div class="box has-shadow">
\t\t\t\t\t\t\t\t<div class="tabs is-centered">
\t\t\t\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t\t\t\t<li class=""><a href="https://scoresaber.com/leaderboard/359150"><span style="color:MediumSeaGreen;">Easy</span></a></li>
\t\t\t\t\t\t\t\t\t\t<li class=""><a href="https://scoresaber.com/leaderboard/359151"><span style="color:#59b0f4;">Normal</span></a></li>
\t\t\t\t\t\t\t\t\t\t<li class=""><a href="https://scoresaber.com/leaderboard/359152"><span style="color:tomato;">Hard</span></a></li>
\t\t\t\t\t\t\t\t\t\t<li class=""><a href="https://scoresaber.com/leaderboard/359153"><span style="color:#bf2a42;">Expert</span></a></li>
\t\t\t\t\t\t\t\t\t\t<li class="is-active"><a href="https://scoresaber.com/leaderboard/359156"><span style="color:#8f48db;">Expert+</span></a></li>
\t\t\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t<div class="ranking global">
\t\t\t\t\t\t\t\t\t<table class="ranking global">
\t\t\t\t\t\t\t\t\t\t<thead>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="picture"></th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\tRank
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\tPlayer
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\tScore
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\tTime Set
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\tMods
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\tPercentage
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t\t<th class="pp">
\t\t\t\t\t\t\t\t\t\t\t\t\tPP
\t\t\t\t\t\t\t\t\t\t\t\t</th>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t</thead>
\t\t\t\t\t\t\t\t\t\t<tbody>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198187936410.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#1
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198187936410">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> Garsh</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,640,118
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t1 month ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.62%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">477.36</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/oculus.png" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#2
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/2085408448198355">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/se.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> Smallfox</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,637,834
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t1 week ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.48%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">476.47</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561197995162898.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#3
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561197995162898">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/ca.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> Electrostats</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,634,735
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t3 weeks ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.3%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">475.27</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198835772160.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#4
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198835772160">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> TornadoEF6</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,633,897
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t2 weeks ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.25%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">474.94</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198862245392.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#5
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198862245392">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> murph</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,633,313
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t2 weeks ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.22%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">474.71</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198362923485.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#6
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198362923485">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/fi.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> Tseska</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,631,736
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t3 days ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.12%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">474.10</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/oculus.png" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#7
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/2321928527908156">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/ca.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> VGN-Orinix</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,630,182
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t13 hours ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.03%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">473.50</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198202538960.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#8
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198202538960">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> Python</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,629,767
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t1 week ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>96.01%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">473.33</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198027277296.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#9
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198027277296">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> ACC | Kira</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,629,404
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t4 weeks ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>95.99%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">473.19</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198988695829.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#10
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198988695829">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/gb.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> OlbmaPhlee</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,629,108
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t3 weeks ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>95.97%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">473.08</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198153101808.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#11
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198153101808">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> Reddek</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,628,785
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t1 month ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>95.95%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">472.95</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="picture">
\t\t\t\t\t\t\t\t\t\t\t\t\t<figure class="image is-24x24">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/usr-avatars/76561198205370764.jpg" style="border-radius: 50%;" />
\t\t\t\t\t\t\t\t\t\t\t\t\t</figure>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="rank">
\t\t\t\t\t\t\t\t\t\t\t\t\t#12
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="player">
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href="/u/76561198205370764">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<img src="/imports/images/flags/us.png" />
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="songTop pp" style="font-weight: 700;"> WDG_McNuggies</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="score">
\t\t\t\t\t\t\t\t\t\t\t\t\t1,627,758
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="timeset">
\t\t\t\t\t\t\t\t\t\t\t\t\t3 weeks ago
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="mods">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>-</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="percentage">
\t\t\t\t\t\t\t\t\t\t\t\t\t<center>95.89%</center>
\t\t\t\t\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t\t\t\t\t\t<td class="pp"><span class="scoreTop ppValue">472.55</span><span class="scoreTop ppLabel">pp</span></td>
\t\t\t\t\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t\t\t\t</tbody>
\t\t\t\t\t\t\t\t\t</table>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t<br />
\t\t\t\t\t\t\t\t<nav class="pagination is-hidden-touch">
\t\t\t\t\t\t\t\t\t<ul class="pagination-list">
\t\t\t\t\t\t\t\t\t\t<li data-page="1">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=1" class="pagination-link is-current" aria-label="Goto page 1">
\t\t\t\t\t\t\t\t\t\t\t\t1
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="2">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=2" class="pagination-link " aria-label="Goto page 2">
\t\t\t\t\t\t\t\t\t\t\t\t2
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="3">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=3" class="pagination-link " aria-label="Goto page 3">
\t\t\t\t\t\t\t\t\t\t\t\t3
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="4">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=4" class="pagination-link " aria-label="Goto page 4">
\t\t\t\t\t\t\t\t\t\t\t\t4
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="5">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=5" class="pagination-link " aria-label="Goto page 5">
\t\t\t\t\t\t\t\t\t\t\t\t5
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="6">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=6" class="pagination-link " aria-label="Goto page 6">
\t\t\t\t\t\t\t\t\t\t\t\t6
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="7">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=7" class="pagination-link " aria-label="Goto page 7">
\t\t\t\t\t\t\t\t\t\t\t\t7
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="8">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=8" class="pagination-link " aria-label="Goto page 8">
\t\t\t\t\t\t\t\t\t\t\t\t8
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="9">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=9" class="pagination-link " aria-label="Goto page 9">
\t\t\t\t\t\t\t\t\t\t\t\t9
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li data-page="10">
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=10" class="pagination-link " aria-label="Goto page 10">
\t\t\t\t\t\t\t\t\t\t\t\t10
\t\t\t\t\t\t\t\t\t\t\t</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li>
\t\t\t\t\t\t\t\t\t\t\t<span class="pagination-ellipsis">&hellip;</span>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t<li>
\t\t\t\t\t\t\t\t\t\t\t<a href="?page=44" class="pagination-link" aria-label="Goto page 44">44</a>
\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t\t\t</nav>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t\t<script src="https://scoresaber.com/imports/js/navbar.js"></script>
\t\t<script src="/imports/js/c3.min.js"></script>
\t\t<script src="/imports/js/d3.min.js"></script>
\t\t<script src="/imports/js/main-new.js?v=1.2"></script>
\t\t<script async src="https://www.googletagmanager.com/gtag/js?id=UA-121352342-1"></script>
 <footer class="footer">
\t<div class="content has-text-centered">
\t\t<p>
\t\t\t<strong>ScoreSaber</strong> by <a href="https://twitter.com/Umbranoxus">Umbranox</a> & <a href="https://scoresaber.com/faq">Team</a>
\t\t\t<br />
\t\t\t<a href="/legal/privacy">Privacy</a>
\t\t</p>
 
\t\t<p><a onclick="httpGetAsync('https://scoresaber.com/imports/user-setting.php?dark=1', null);" href="#">Switch to dark mode</a></p>
\t</div>
</footer>

\t</body>
</html>
`
    return processLeaderboard(leaderboardId, new DOMParser().parseFromString(doc, 'text/html'));
  }

  // const leaderboard = async (leaderboardId, page = 1, signal = null, priority = PRIORITY.FG_LOW) => fetchHtml(substituteVars(LEADERBOARD_URL, {leaderboardId, page}), {signal}, priority)
  //   .then(r => r.body)
  //   .then(doc => processLeaderboard(leaderboardId, doc));

  return {
    rankeds,
    player,
    countryRanking,
    leaderboard,
    ...queueToReturn,
  }
}