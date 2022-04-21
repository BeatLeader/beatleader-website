import clansApiClient from '../../network/clients/beatleader/clans/api-clans'
import clanApiClient from '../../network/clients/beatleader/clans/api-clan'
import makePendingPromisePool from '../../utils/pending-promises'
import {PRIORITY} from '../../network/queues/http-queue'
import {CLANS_PER_PAGE} from '../../utils/beatleader/consts'
import {MINUTE} from '../../utils/date'

let service = null;
export default () => {
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const fetchClansPage = async (page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/clans/${page}`, () => clansApiClient.getProcessed({page, filters, signal, priority, cacheTtl: force ? null : MINUTE,}));
  const fetchClanPage = async (clanId, page = 1, filters = {}, priority = PRIORITY.FG_LOW, signal = null, force = false) => resolvePromiseOrWaitForPending(`apiClient/clan/${clanId}/${page}`, () => clanApiClient.getProcessed({clanId, page, filters, signal, priority, cacheTtl: force ? null : MINUTE,}));

  const destroyService = () => {
    service = null;
  }

  service = {
    fetchClansPage,
    fetchClanPage,
    CLANS_PER_PAGE,
    destroyService,
  }

  return service;
}