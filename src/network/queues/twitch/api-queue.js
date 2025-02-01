import {default as createQueue, PRIORITY} from '../http-queue';
import ssrConfig from '../../../ssr-config';
import {substituteVarsUrl} from '../../../utils/format';

const CLIENT_ID = '0zw90y7zu0p7no51ags9ocl0jwi2yj';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2';
const AUTHORIZATION_URL =
	`${TWITCH_AUTH_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
		ssrConfig.domain + '/twitch'
	)}&response_type=token` + '&scope=${scopes}&state=${state}';
const VALIDATE_URL = `${TWITCH_AUTH_URL}/validate`;

const TWITCH_API_URL = 'https://api.twitch.tv/helix';
const PROFILE_URL = TWITCH_API_URL + '/users?login=${login}';
const VIDEOS_URL = TWITCH_API_URL + '/videos?user_id=${userId}&type=${type}&first=100';
const STREAMS_URL = TWITCH_API_URL + '/streams?user_id=${userId}';

export default (options = {}) => {
	const queue = createQueue(options);

	const {fetchJson, fetchHtml, ...queueToReturn} = queue;

	const fetchApi = (url, accessToken, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(
			url,
			{
				...options,
				headers: {
					'Client-ID': CLIENT_ID,
					Authorization: `Bearer ${accessToken}`,
				},
			},
			priority
		);

	const getAuthUrl = (state = '', scopes = '') => substituteVarsUrl(AUTHORIZATION_URL, {state: state, scopes: scopes});

	const validateToken = async (accessToken, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchJson(VALIDATE_URL, {...options, headers: {Authorization: `OAuth ${accessToken}`}}, priority);

	const profile = async (accessToken, login, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchApi(substituteVarsUrl(PROFILE_URL, {login: login}), accessToken, priority, options);

	const videos = async (accessToken, userId, type = 'archive', priority = PRIORITY.FG_LOW, options = {}) =>
		fetchApi(substituteVarsUrl(VIDEOS_URL, {userId: userId, type: type}), accessToken, priority, options);

	const streams = async (accessToken, userId, priority = PRIORITY.FG_LOW, options = {}) =>
		fetchApi(substituteVarsUrl(STREAMS_URL, {userId: userId}), accessToken, priority, options);

	return {
		getAuthUrl,
		validateToken,
		profile,
		videos,
		streams,
		...queueToReturn,
	};
};
