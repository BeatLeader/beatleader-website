import clansApiClient from '../../network/clients/beatleader/clans/api-clans'
import clanApiClient from '../../network/clients/beatleader/clans/api-clan'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/queues/http-queue'
import {CLANS_PER_PAGE} from '../../utils/beatleader/consts'
import {MINUTE, SECOND} from '../../utils/date'
import createAccountStore from '../../stores/beatleader/account'

let service = null;
export default () => {
  if (service) return service;

  const account = createAccountStore();

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchClansPage = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/clans/${page}`, () => clansApiClient.getProcessed({page, filters, signal, priority, cacheTtl: force ? null : MINUTE, maxAge: force ? SECOND : MINUTE}));

  const fetchClanPage = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/clan/${clanId}/${page}`, () => clanApiClient.getProcessed({clanId, page, filters, signal, priority, cacheTtl: force ? null : MINUTE, maxAge: force ? SECOND : MINUTE}));

  const create = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.name || !clan.tag || !clan.color || !clan?.icon) throw new Error('Fill in all required fields');

    const createdClan = await clanApiClient.create({...clan, signal, priority});

    account.setPlayerClan(createdClan);

    return createdClan;
  }

  const update = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.name || !clan.color || !clan?.icon) throw new Error('Fill in all required fields');

    await clanApiClient.update({...clan, signal, priority});

    account.setPlayerClan(clan);

    return clan;
  }

  const accept = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.id) throw new Error('Clan is required');

    await clanApiClient.accept({clanId: clan.id, signal, priority});

    account.addClan(clan);

    return clan;
  }

  const reject = async (clan, ban = false, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.id) throw new Error('Clan is required');

    ban = !!ban;

    await clanApiClient.reject({clanId: clan.id, ban, signal, priority});

    account.removeClanRequest(clan);

    if (ban) account.banClan(clan);

    return clan;
  }

  const remove = async (priority = PRIORITY.FG_HIGH, signal = null) => {
    await clanApiClient.remove({signal, priority});

    account.setPlayerClan(null);
  }

  const leave = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.id) throw new Error('Clan is required');

    await clanApiClient.leave({clanId: clan.id, signal, priority});

    account.removeClan(clan);

    return clan;
  }

  const unban = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.id) throw new Error('Clan is required');

    await clanApiClient.unban({clanId: clan.id, signal, priority});

    account.unbanClan(clan);

    return clan;
  }

  const kick = async (player, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!player?.playerId?.length) throw new Error('PlayerId is required');

    await clanApiClient.kick({playerId: player.playerId, signal, priority});
  }

  const destroyService = () => {
    service = null;
  }

  service = {
    fetchClansPage,
    fetchClanPage,
    create,
    update,
    accept,
    reject,
    remove,
    leave,
    unban,
    kick,
    CLANS_PER_PAGE,
    destroyService,
  }

  return service;
}