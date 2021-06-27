import {default as createQueue, PRIORITY} from '../http-queue';
import {substituteVars} from '../../utils/format'
import {extractDiffAndType} from '../../utils/scoresaber/format'
import cfDecryptEmail from '../../utils/cf-email-decrypt'
import {getFirstRegexpMatch, opt} from '../../utils/js'
import {dateFromString} from '../../utils/date'

export const SS_HOST = 'https://scoresaber.com';
const SS_CORS_HOST = '/cors/score-saber';
const RANKEDS_URL = SS_CORS_HOST + '/api.php?function=get-leaderboards&cat=1&limit=5000&ranked=1&page=${page}';
const PLAYER_PROFILE = SS_CORS_HOST + '/u/${playerId}?page=1&sort=2'

export const parseSsInt = text => parseInt(getFirstRegexpMatch(/([0-9,]+)\s*$/, text)?.replace(/[^\d]/g, '') ?? null, 10)
export const parseSsFloat = text => parseFloat(getFirstRegexpMatch(/([0-9,.]+)\s*$/, text?.replace(/[^\d.]/g, '')) ?? null)

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

  const player = async (playerId, signal = null, priority = PRIORITY.FG_LOW) => fetchHtml(substituteVars(PLAYER_PROFILE, {playerId}), {signal}, priority)
    .then(r => r.body)
    .then(page => processPlayerProfile(playerId, page));

  return {
    rankeds,
    player,
    ...queueToReturn,
  }
}