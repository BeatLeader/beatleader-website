export default () => {
  let currentService = null;
  let currentServiceParams = {};

  const getAllServices = () => ['scoresaber', 'beatsavior', 'accsaber'];

  const get = () => ({service: currentService, params: currentServiceParams});

  const getDefaultParams = service => {
    switch (service) {
      case 'beatsavior':
        return {sort: 'recent', page: 1, filters: {}};

      case 'accsaber':
        return {type: 'overall', sort: 'recent', page: 1, filters: {}}

      case 'scoresaber':
      default:
        return {sort: 'recent', page: 1, filters: {}}
    }
  }

  const update = (serviceParams = {}, service = currentService) => {
    const availableServices = getAllServices();
    if (!availableServices.includes(service)) service = availableServices?.[0] ?? 'scoresaber';

    const defaultServiceParams = getDefaultParams(service);

    if (defaultServiceParams?.page && !Number.isFinite(serviceParams?.page)) {
      const val = parseInt(serviceParams?.page, 10);
      serviceParams.page = !isNaN(val) ? val : 1;
    }

    currentService = service;
    currentServiceParams = {...defaultServiceParams, ...currentServiceParams, ...serviceParams}

    return get();
  }

  const set = (serviceParams = {}, service = currentService) => {
    currentServiceParams = {};

    return update(serviceParams, service)
  }

  const initFromUrl = (url = null) => {
    const availableServices = getAllServices();
    const defaultService = availableServices?.[0] ?? 'scoresaber';
    const paramsArr = url ? url.split('/') : [defaultService];

    const service = paramsArr[0] ?? 'scoresaber';

    const serviceDefaultParams = getDefaultParams(service);

    switch (service) {
      case 'beatsavior':
        return set(
          {
            sort: paramsArr[1] ?? serviceDefaultParams?.sort,
            page: paramsArr[2] ?? serviceDefaultParams?.page,
          },
          service,
        );

      case 'accsaber':
        return set(
          {
            type: paramsArr[1] ?? serviceDefaultParams?.type,
            sort: paramsArr[2] ?? serviceDefaultParams?.sort,
            page: paramsArr[3] ?? serviceDefaultParams?.page,
          },
          service,
        );

      case 'scoresaber':
      default:
        return set(
          {
            sort: paramsArr[1] ?? serviceDefaultParams?.sort,
            page: paramsArr[2] ?? serviceDefaultParams?.page,
          },
          service,
        );
    }
  }

  const getUrl = (service, params = {}) => {
    if (!service) return '';

    const serviceDefaultParams = getDefaultParams(service);

    switch (service) {
      case 'beatsavior':
        return `${service}/${params?.sort ?? serviceDefaultParams?.sort}/${params?.page ?? serviceDefaultParams?.page}`;

      case 'accsaber':
        return `${service}/${params?.type ?? serviceDefaultParams?.type}/${params?.sort ?? serviceDefaultParams?.sort}/${params?.page ?? serviceDefaultParams?.page}`;

      case 'scoresaber':
        return `${service}/${params?.sort ?? serviceDefaultParams?.sort}/${params?.page ?? serviceDefaultParams?.page}`;
    }
  }

  const getCurrentServiceUrl = () => getUrl(currentService, currentServiceParams);
  const getDefaultServiceUrl = (service = currentService) => getUrl(service, {});

  return {
    getAvailableServices: getAllServices,
    initFromUrl,
    getDefaultServiceUrl,
    getCurrentServiceUrl,
    get,
    getService: () => currentService,
    getParams: () => currentServiceParams,
    update,
    set,
  }
}