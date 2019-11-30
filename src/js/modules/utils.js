export { getFromStorage, setToStorage };

function assertStorageType(storageType) {
  const storageTypes = ['local', 'sync', 'managed'];
  if (!storageTypes.includes(storageType)) {
    throw new Error('Wrong storage type');
  }
}

async function getFromStorage(
    key,
    defaultValue = 'None',
    storageType = 'local'
) {
  assertStorageType(storageType);
  let result = await browser.storage[storageType].get({ [key]: defaultValue });
  return result[key];
}

function setToStorage(key, value, storageType = 'local') {
  assertStorageType(storageType);
  browser.storage[storageType].set({ [key]: value });
}
