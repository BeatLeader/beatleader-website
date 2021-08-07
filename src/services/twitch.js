import queues from '../network/queues/queues';
import ssrConfig from '../ssr-config'
import keyValueRepository from '../db/repository/key-value'
import eventBus from '../utils/broadcast-channel-pubsub'
import log from '../utils/logger'
import {HOUR} from '../utils/date'
import {getFirstRegexpMatch} from '../utils/js'

const TWITCH_TOKEN_KEY = 'twitchToken';

const REFRESH_INTERVAL = HOUR;

let service = null;
export default () => {
  if (service) return service;

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

  const refresh = async (forceUpdate = false, priority = queues.PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting Twitch videos refreshing${forceUpdate ? ' (forced)' : ''}...`, 'TwitchService')

    try {

    } catch (e) {
        if (throwErrors) throw e;

        log.debug(`Twitch videos refreshing error`, 'TwitchService', e)

        return null;
      }
  }

  const destroyService = () => {
    service = null;
  }

  service = {
    getAuthUrl,
    getTwitchTokenFromUrl,
    processToken,
    getCurrentToken,
    refresh,
    destroyService,
  }

  return service;
}