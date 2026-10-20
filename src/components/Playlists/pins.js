import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

const request = async (method, path, body) => {
	const response = await fetch(BL_API_URL + path, {
		method,
		credentials: 'include',
		headers: body !== undefined ? {'Content-Type': 'application/json'} : undefined,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});
	if (!response.ok) throw new Error((await response.text().catch(() => '')) || response.statusText);
	return response.json().catch(() => null);
};

export const getPinnedPlaylists = playerId => request('GET', `player/${encodeURIComponent(playerId)}/pinnedPlaylists`);
export const pinPlaylist = (playlistId, description) => request('PUT', `v2/playlist/${playlistId}/pin`, {description: description || null});
export const unpinPlaylist = playlistId => request('DELETE', `v2/playlist/${playlistId}/pin`);
export const orderPinnedPlaylists = playlistIds => request('PUT', 'v2/user/pinnedPlaylists/order', playlistIds);
