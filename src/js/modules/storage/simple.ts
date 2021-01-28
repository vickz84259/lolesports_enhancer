export {
  getFromStorage as get,
  setToStorage as set
};

type StorageType = browser.storage.StorageName
type StorageValue = browser.storage.StorageValue

function assertStorageType(storageType: string): void {
  const storageTypes = ['local', 'sync', 'managed'];
  if (!storageTypes.includes(storageType)) {
    throw new Error('Wrong storage type');
  }
}

/**
 *
 * @param {string} key
 * @param {string} [defaultValue] - The value to return if the key is not found
 * @param {StorageType} [storageType="local"]
 *
 * @returns {Promise} The value that was retrieved from storage
 */
async function getFromStorage(
    key: string,
    defaultValue = 'None',
    storageType: StorageType = 'local'
): Promise<StorageValue> {

  assertStorageType(storageType);

  const result = await browser.storage[storageType].
    get({ [key]: defaultValue });
  return result[key];
}

/**
 * @param {string} key
 * @param {StorageValue} value - value is converted to JSON
 *    internally
 * @param {StorageType} [storageType="local"]
 */
function setToStorage(
    key: string,
    value: StorageValue,
    storageType: StorageType = 'local'
): void {

  assertStorageType(storageType);
  browser.storage[storageType].set({ [key]: value });
}
