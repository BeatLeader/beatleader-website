import reepresetsApiClient from '../../network/clients/beatleader/reepresets/api-presets';
import reepresetApiClient from '../../network/clients/beatleader/reepresets/api-preset';
import makePendingPromisePool from '../../utils/pending-promises';
import {PRIORITY} from '../../network/queues/http-queue';
import {CLANS_PER_PAGE} from '../../utils/beatleader/consts';
import {MINUTE, SECOND} from '../../utils/date';
import createAccountStore from '../../stores/beatleader/account';

let service = null;
export default () => {
	if (service) return service;

	const account = createAccountStore();

	const resolvePromiseOrWaitForPending = makePendingPromisePool();

	const fetchPresetsPage = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/presets/${page}`, () =>
			reepresetsApiClient.getProcessed({page, filters, signal, priority, cacheTtl: force ? null : MINUTE, maxAge: force ? SECOND : MINUTE})
		);

	const fetchPresetPage = async (presetId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) =>
		resolvePromiseOrWaitForPending(`apiClient/presets/${presetId}/${page}`, () =>
			reepresetApiClient.getProcessed({
				presetId,
				page,
				filters,
				signal,
				priority,
				cacheTtl: force ? null : MINUTE,
				maxAge: force ? SECOND : MINUTE,
			})
		);

	const create = async (preset, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!preset?.name || !preset.description) throw new Error('Fill in all required fields');

		return await reepresetApiClient.create({...preset, signal, priority});
	};

	const update = async (preset, priority = PRIORITY.FG_HIGH, signal = null) => {
		return await reepresetApiClient.update({...preset, signal, priority});
	};

	const react = async (preset, reaction, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!preset?.id) throw new Error('Clan is required');

		await reepresetApiClient.react({presetId: preset.id, reaction, signal, priority});
	};

	const reject = async (clan, ban = false, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!clan?.id) throw new Error('Clan is required');

		ban = !!ban;

		await reepresetApiClient.reject({clanId: clan.id, ban, signal, priority});

		account.removeClanRequest(clan);

		if (ban) account.banClan(clan);

		return clan;
	};

	const remove = async (presetId, priority = PRIORITY.FG_HIGH, signal = null) => {
		await reepresetApiClient.remove({presetId, signal, priority});
	};

	const leave = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!clan?.id) throw new Error('Clan is required');

		await reepresetApiClient.leave({clanId: clan.id, signal, priority});

		account.removeClan(clan);

		return clan;
	};

	const unban = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!clan?.id) throw new Error('Clan is required');

		await reepresetApiClient.unban({clanId: clan.id, signal, priority});

		account.unbanClan(clan);

		return clan;
	};

	const kick = async (player, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!player?.playerId?.length) throw new Error('PlayerId is required');

		await reepresetApiClient.kick({playerId: player.playerId, signal, priority});
	};

	const invite = async (playerId, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!playerId?.length) throw new Error('PlayerId is required');

		await reepresetApiClient.invite({playerId, signal, priority});

		account.addClanInvitation(playerId);
	};

	const cancelInvite = async (playerId, priority = PRIORITY.FG_HIGH, signal = null) => {
		if (!playerId?.length) throw new Error('PlayerId is required');

		await reepresetApiClient.cancelInvite({playerId, signal, priority});

		account.removeClanInvitation(playerId);
	};

	const destroyService = () => {
		service = null;
	};

	service = {
		fetchPresetsPage,
		fetchPresetPage,
		create,
		update,
		react,
		reject,
		remove,
		leave,
		unban,
		kick,
		invite,
		cancelInvite,
		CLANS_PER_PAGE,
		destroyService,
	};

	return service;
};
