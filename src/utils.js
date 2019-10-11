export { isEmpty, setToStorage };

function isEmpty(object) {
  return Object.keys(object).length === 0 && object.constructor === Object;
}

function assertStorageType(storageType) {
  const storageTypes = ['local', 'sync', 'managed'];
  if (!storageTypes.includes(storageType)) throw new Error('Wrong storage type');
}

function setToStorage(key, value = {}, storageType = 'local') {
  /* beautify preserve:start */
  assertStorageType(storageType);
  browser.storage[storageType].set({ [key]: JSON.stringify(value) });
  /* beautify preserve:end */
}