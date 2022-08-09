import { processScore } from './processScore'

export default response => {
  if (!Array.isArray(response?.data)) return { metadata: response?.metadata ?? {}, data: [] };

  return {
    metadata: response?.metadata ?? {},
    data: response.data.map(processScore)
  };
}