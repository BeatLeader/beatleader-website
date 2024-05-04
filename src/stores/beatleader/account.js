import {writable} from 'svelte/store';
import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
import userApiClient from '../../network/clients/beatleader/account/api';
import queue from '../../network/queues/queues';
import {configStore} from '../config';

let store = null;
let storeSubCount = 0;

export default (refreshOnCreate = true) => {
	storeSubCount++;
	if (store) return store;

	const checkResponse = async response => response.text();

	let account = {loading: true};

	const {subscribe: subscribeState, set} = writable(account);

	const get = () => account;

	const refresh = async () => {
		try {
			const user = await userApiClient.getProcessed();
			if (!user) throw 'Data error';

			account = {...user, id: user.player?.playerId ?? null};
		} catch (err) {
			account = {refreshError: true};
		}

		set(account);
	};

	if (refreshOnCreate) refresh();

	const subscribe = fn => {
		const stateUnsubscribe = subscribeState(fn);

		return () => {
			storeSubCount--;

			if (storeSubCount === 0) {
				store = null;

				stateUnsubscribe();
			}
		};
	};

	const logIn = (login, password, oauthState) => {
		let data = new FormData();
		data.append('action', 'login');
		data.append('login', login);
		data.append('password', password);

		fetch(BL_API_URL + 'signinoculus', {
			credentials: 'include',
			method: 'POST',
			body: data,
		})
			.then(checkResponse)
			.then(data => {
				if (data.length > 0) {
					account.error = data;
				} else {
					account.error = null;
					refresh(true);
					configStore.syncFromServer();
				}
				set(account);
			});
	};

	const migrate = (login, password) => {
		let data = new FormData();
		data.append('action', 'login');
		data.append('login', login);
		data.append('password', password);

		fetch(BL_API_URL + 'user/migrate', {
			credentials: 'include',
			method: 'POST',
			body: data,
		})
			.then(checkResponse)
			.then(data => {
				if (data.length > 0) {
					account.error = data;
				} else {
					account.error = null;
					refresh(true);
				}
				set(account);
			});
	};

	const changePassword = (login, password, newPassword) => {
		let data = new FormData();
		data.append('login', login);
		data.append('oldPassword', password);
		data.append('newPassword', newPassword);

		fetch(BL_API_URL + 'user/changePassword', {
			credentials: 'include',
			method: 'PATCH',
			body: data,
		})
			.then(checkResponse)
			.then(data => {
				if (data.length > 0) {
					account.error = data;
				} else {
					account.message = 'Password changed successfully ✔';
					account.error = null;

					setTimeout(function () {
						refresh(true);
					}, 6000);
				}
				set(account);
			});
	};

	const changePasswordMigrated = (login, newPassword) => {
		let data = new FormData();
		data.append('login', login);
		data.append('newPassword', newPassword);

		fetch(BL_API_URL + 'user/resetPassword', {
			credentials: 'include',
			method: 'PATCH',
			body: data,
		})
			.then(checkResponse)
			.then(data => {
				if (data.length > 0) {
					account.error = data;
				} else {
					account.message = 'Password changed successfully ✔';
					account.error = null;

					setTimeout(function () {
						refresh(true);
					}, 6000);
				}
				set(account);
			});
	};

	const update = async (data, avatar = null) => {
		const url = new URL(BL_API_URL + 'user');
		Object.entries(data).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});

		var coverUrl = new URL(BL_API_URL + 'user/cover');
		if (data.id) {
			coverUrl.searchParams.append('id', data.id);
		}

		return (
			data.profileCover != data.profileCoverData
				? fetch(coverUrl.toString(), {
						credentials: 'include',
						method: data.profileCoverData ? 'PATCH' : 'DELETE',
						body: data.profileCoverData,
				  })
				: Promise.resolve(42)
		).then(_ =>
			fetch(url.toString(), {
				credentials: 'include',
				method: 'PATCH',
				body: avatar ?? null,
			})
				.then(checkResponse)
				.then(data => {
					if (data.length > 0) {
						account.error = data;

						throw data;
					} else {
						account.message = 'Data saved!';
						account.error = null;
						setTimeout(function () {
							refresh(true);
						}, 6000);
					}
					set(account);

					return account;
				})
		);
	};

	const changeLogin = newLogin => {
		let data = new FormData();
		data.append('newLogin', newLogin);

		fetch(BL_API_URL + 'user/changeLogin', {
			credentials: 'include',
			method: 'PATCH',
			body: data,
		})
			.then(checkResponse)
			.then(data => {
				if (data.length > 0) {
					account.error = data;
				} else {
					account.message = 'Login changed successfully ✔';

					setTimeout(function () {
						refresh(true);
					}, 3500);
				}
				set(account);
			});
	};

	const logOut = () => {
		fetch(BL_API_URL + 'signout', {
			credentials: 'include',
		}).then(_ => {
			refresh(true);
		});
	};

	const refreshPatreon = () => {
		fetch(BL_API_URL + 'refreshmypatreon', {
			credentials: 'include',
		})
			.then(checkResponse)
			.then(data => {
				if (data.length > 0) {
					account.error = data;
				} else {
					account.error = null;
					refresh(true);
				}
				set(account);
			});
	};

	const banPlayer = (playerId, reason, duration) => {
		account.loading = true;
		set(account);
		fetch(BL_API_URL + 'user/ban' + (playerId ? `?id=${playerId}&reason=${reason}&duration=${duration}` : ''), {
			method: 'POST',
			credentials: 'include',
		})
			.then(checkResponse)
			.then(data => {
				account.error = null;
				account.loading = false;
				if (data.length > 0) {
					account.error = data;
				} else {
					if (playerId) {
						document.location.reload();
					}
					account.message = playerId ? 'Player banned ✔' : 'Account suspended ✔';
				}

				setTimeout(function () {
					account.error = null;
					account.message = null;
					set(account);
				}, 6000);

				set(account);
			});
	};

	const unbanPlayer = playerId => {
		account.loading = true;
		set(account);
		fetch(BL_API_URL + 'user/unban' + (playerId ? `?id=${playerId}` : ''), {
			method: 'POST',
			credentials: 'include',
		})
			.then(checkResponse)
			.then(data => {
				account.error = null;
				account.loading = false;
				if (data.length > 0) {
					account.error = data;
				} else {
					if (playerId) {
						document.location.reload();
					}
					account.message = playerId ? 'Player unbanned ✔' : 'Welcome back ✔';
				}

				setTimeout(function () {
					account.error = null;
					account.message = null;
					set(account);
				}, 6000);

				set(account);
			});
	};

	const removeClanRequest = (clan, setAccount = true) => {
		if (Array.isArray(account?.clanRequest) && clan?.id) {
			account.clanRequest = account.clanRequest.filter(r => r?.id !== clan.id);
		}

		if (setAccount) set(account);
	};

	const addClan = clan => {
		if (Array.isArray(account?.player?.clans)) {
			account.player.clans.push(clan);
		}

		removeClanRequest(clan, false);

		set(account);
	};

	const removeClan = clan => {
		if (Array.isArray(account?.player?.clans)) {
			account.player.clans = account.player.clans.filter(c => c?.id !== clan.id);
		}

		set(account);
	};

	const banClan = clan => {
		if (Array.isArray(account?.bannedClans)) {
			account.bannedClans.push(clan);
		}

		set(account);
	};

	const unbanClan = clan => {
		if (Array.isArray(account?.bannedClans)) {
			account.bannedClans = account.bannedClans.filter(c => c?.id !== clan.id);
		}

		set(account);
	};

	const addClanInvitation = playerId => {
		if (Array.isArray(account?.clan?.pendingInvites)) {
			account.clan.pendingInvites.push(playerId);
		}

		set(account);
	};

	const removeClanInvitation = playerId => {
		if (Array.isArray(account?.clan?.pendingInvites)) {
			account.clan.pendingInvites = account.clan.pendingInvites.filter(pId => pId !== playerId);
		}

		set(account);
	};

	const setPlayerClan = clan => {
		account.clan = clan;

		set(account);
	};

	const addFollowed = async playerId => queue.BEATLEADER_API.addFollowed(playerId).finally(refresh);

	const removeFollowed = async playerId => queue.BEATLEADER_API.removeFollowed(playerId).finally(refresh);

	const refreshLastQualificationTime = (hash, completion) => {
		fetch(BL_API_URL + 'prevQualTime/' + hash, {credentials: 'include'})
			.then(response => response.json())
			.then(data => {
				completion(data.time);
			});
	};

	store = {
		subscribe,
		get,
		refresh,
		logIn,
		logOut,
		migrate,
		update,
		banPlayer,
		unbanPlayer,
		changePassword,
		changePasswordMigrated,
		setPlayerClan,
		addClan,
		removeClan,
		removeClanRequest,
		banClan,
		unbanClan,
		addClanInvitation,
		removeClanInvitation,
		changeLogin,
		addFollowed,
		removeFollowed,
		refreshLastQualificationTime,
		refreshPatreon,
	};

	return store;
};
