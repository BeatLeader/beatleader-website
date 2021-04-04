import ssApi from '../../network/ss-api'

export default async ({playerId, page = 1, signal = null} = {}) => ssApi.recentScores(playerId, page, signal);