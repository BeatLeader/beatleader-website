import queues from '../network/queues/queues';
import keyValueRepository from '../db/repository/key-value'
import twitchRepository from '../db/repository/twitch'
import createPlayerService from './beatleader/player'
import profileApiClient from '../network/clients/twitch/api-profile'
import videosApiClient from '../network/clients/twitch/api-videos'
import eventBus from '../utils/broadcast-channel-pubsub'
import log from '../utils/logger'
import {addToDate, dateFromString, durationToMillis, formatDate, millisToDuration, MINUTE} from '../utils/date'
import {PRIORITY} from '../network/queues/http-queue'
import makePendingPromisePool from '../utils/pending-promises'

const TWITCH_TOKEN_KEY = 'twitchToken';

const REFRESH_INTERVAL = 5 * MINUTE;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const playerService = createPlayerService();

  const getAuthUrl = (state = '', scopes = '') => queues.TWITCH.getAuthUrl(state, scopes)

  const getTwitchTokenFromUrl = () => {
    const url = (new URL(document.location));

    const error = url.searchParams.get('error')
    if (error) {
      const errorMsg = url.searchParams.get('error_description');
      throw new Error(errorMsg ? errorMsg : error);
    }

    const hash = url.hash;
    if (!hash || !hash.length) throw new Error("Twitch did not return access token")

    const accessTokenMatch = /access_token=(.*?)(&|$)/.exec(hash);
    if (!accessTokenMatch) throw new Error("Twitch did not return access token")

    const stateMatch = /state=(.*?)(&|$)/.exec(hash);

    return {accessToken: accessTokenMatch[1], url: stateMatch ? decodeURIComponent(stateMatch[1]) : ''};
  }

  const processToken = async accessToken => {
    // validate token
    const tokenValidation = (await queues.TWITCH.validateToken(accessToken)).body;

    const expiresIn = tokenValidation.expires_in * 1000;

    const twitchToken = {
      ...tokenValidation,
      accessToken,
      obtained: new Date(),
      expires: new Date(Date.now() + expiresIn),
      expires_in: expiresIn,
    }

    await keyValueRepository().set(twitchToken, TWITCH_TOKEN_KEY);

    eventBus.publish('twitch-token-refreshed', twitchToken)

    return twitchToken
  }

  const getCurrentToken = async () => keyValueRepository().get(TWITCH_TOKEN_KEY, true);

  const fetchProfile = async (login, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) => {
    const token = await getCurrentToken();
    if (!token || !token.expires || token.expires <= new Date()) return null;

    return resolvePromiseOrWaitForPending(`profileApiClient/${login}/${fullResponse}`, () => profileApiClient.getProcessed({...options, accessToken: token.accessToken, login, priority, fullResponse}));
  }

  const fetchVideos = async (userId, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) => {
    const token = await getCurrentToken();
    if (!token || !token.expires || token.expires <= new Date()) return null;

    return resolvePromiseOrWaitForPending(`videosApiClient/${userId}/${fullResponse}`, () => videosApiClient.getProcessed({...options, accessToken: token.accessToken, userId, priority, fullResponse}));
  }

  const getPlayerProfile = async playerId => twitchRepository().get(playerId);
  const updatePlayerProfile = async twitchProfile => twitchRepository().set(twitchProfile);

  const refresh = async (playerId, forceUpdate = false, priority = queues.PRIORITY.FG_LOW, throwErrors = false) => {
    log.trace(`Starting Twitch videos refreshing${forceUpdate ? ' (forced)' : ''}...`, 'TwitchService')

    if (!playerId) {
      log.debug(`No playerId provided, skipping`, 'TwitchService')

      return null;
    }

    try {
      let twitchProfile = await twitchRepository().get(playerId);
      if (!twitchProfile || !twitchProfile.login) {
        log.debug(`Twitch profile for player ${playerId} is not set, skipping`, 'TwitchService')

        return null;
      }

      const lastUpdated = twitchProfile.lastUpdated;
      if (!forceUpdate) {
        if (lastUpdated && lastUpdated > new Date() - REFRESH_INTERVAL) {
          log.debug(`Refresh interval not yet expired, skipping. Next refresh on ${formatDate(addToDate(REFRESH_INTERVAL, lastUpdated))}`, 'TwitchService')

          return twitchProfile;
        }
      }

      if (!twitchProfile.id) {
        const fetchedProfile = await fetchProfile(twitchProfile.login);
        if (!fetchedProfile) {
          log.debug(`Can not fetch Twitch profile for player ${playerId}, skipping`, 'TwitchService')

          return twitchProfile;
        }

        twitchProfile = {...twitchProfile, ...fetchedProfile, playerId};

        await updatePlayerProfile(twitchProfile);
      }

      const videos = await fetchVideos(twitchProfile.id);

      twitchProfile.videos = videos;
      twitchProfile.lastUpdated = new Date();
      await updatePlayerProfile(twitchProfile);

      if (videos && videos.length) {
        eventBus.publish('player-twitch-videos-updated', {
          playerId,
          twitchProfile,
        });
      }

      return twitchProfile;
    } catch (e) {
        if (throwErrors) throw e;

        log.debug(`Twitch player ${playerId} refreshing error`, 'TwitchService', e)

        return null;
      }
  }

  async function findTwitchVideo(playerTwitchProfile, timeset, songLength) {
    if (!playerTwitchProfile || !playerTwitchProfile.videos || !timeset || !songLength) return null;

    const songStarted = addToDate(-songLength * 1000, timeset)
    const video = playerTwitchProfile.videos
      .map(v => ({
        ...v,
        created_at: dateFromString(v.created_at),
        ended_at: addToDate(durationToMillis(v.duration), dateFromString(v.created_at)),
      }))
      .find(v => v.created_at <= songStarted && songStarted < v.ended_at);

    return video ? {...video, url: video.url + '?t=' + millisToDuration(songStarted - video.created_at)} : null;
  }

  const destroyService = () => {
    serviceCreationCount--;

    if (serviceCreationCount === 0) {
      service = null;
      playerService.destroyService();
    }
  }

  service = {
    getAuthUrl,
    getTwitchTokenFromUrl,
    processToken,
    getCurrentToken,
    getPlayerProfile,
    updatePlayerProfile,
    fetchProfile,
    findTwitchVideo,
    refresh,
    destroyService,
  }

  return service;
}