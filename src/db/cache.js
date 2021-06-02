export default (name, getObjKey) => {
  let cache = {};

  const set = (key, value) => {
    cache[key] = value;

    return value;
  };

  const setAll = (data) => {
    cache = data;

    return cache;
  }
  const merge = (data) => {
    cache = {...cache, ...data}

    return cache;
  }

  const get = async (key, fetchFunc) => {
    if (cache.hasOwnProperty(key)) return cache[key];

    const value = await fetchFunc();

    return set(key, value);
  };

  const getByFilter = async (fetchFunc, filterFunc) => {
    if (filterFunc) {
      const obj = Object.values(cache).find(filterFunc);
      if (obj) return obj;
    }

    const value = await fetchFunc();

    const key = getObjKey(value);

    return set(key, value);
  }

  const getAll = () => cache;

  const has = key => cache[key] !== undefined;

  const getKeys = () => Object.keys(cache);

  const forget = (key) => {
    delete cache[key];

    return cache;
  }

  const forgetByFilter = (filterFunc) => {
    if (!filterFunc) return false;

    Object.keys(cache).filter(key => filterFunc(cache[key])).map(key => delete cache[key]);

    return true;
  }

  const flush = () => {
    cache = {};

    return cache;
  }

  return {
    has,
    get,
    getByFilter,
    getAll,
    set,
    setAll,
    merge,
    getKeys,
    forget,
    forgetByFilter,
    flush,
  }
}
