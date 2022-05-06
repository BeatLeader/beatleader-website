import clansApiClient from '../../network/clients/beatleader/clans/api-clans'
import clanApiClient from '../../network/clients/beatleader/clans/api-clan'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/queues/http-queue'
import {CLANS_PER_PAGE} from '../../utils/beatleader/consts'
import {MINUTE, SECOND} from '../../utils/date'
import {BL_API_URL} from '../../network/queues/beatleader/api-queue'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchClansPage = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/clans/${page}`, () => clansApiClient.getProcessed({page, filters, signal, priority, cacheTtl: force ? null : MINUTE, maxAge: force ? SECOND : MINUTE}));

  const fetchClanPage = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/clan/${clanId}/${page}`, () => clanApiClient.getProcessed({clanId, page, filters, signal, priority, cacheTtl: force ? null : MINUTE,}));

  const create = async (clan, priority = PRIORITY.FG_HIGH, signal = null) => {
    if (!clan?.name || !clan.tag || !clan.color || !clan?.icon) throw new Error('Fill in all required fields');

    const createdClan = await clanApiClient.create({...clan, signal, priority});

    // TODO: add clan to the account @see account.js:315
    console.warn('TODO: add clan to the account', createdClan);

    return createdClan;
  }

  const acceptRequest = async (id) => fetch(`${BL_API_URL}clan/accept?id=${id}`, {credentials: 'include', method: 'POST'});

  const rejectRequest = async (id, ban = false) => fetch(`${BL_API_URL}clan/reject?id=${id}&ban=${ban ? "true" : "false"}`, {credentials: 'include', method: 'POST'});

  const destroyService = () => {
    service = null;
  }

  service = {
    fetchClansPage,
    fetchClanPage,
    create,
    acceptRequest,
    rejectRequest,
    CLANS_PER_PAGE,
    destroyService,
  }

  return service;
}