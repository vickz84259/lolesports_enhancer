export {
  getFromStorage as get,
  setToStorage as set
};

/** @param {string} storageType */
function assertStorageType(storageType) {
  const storageTypes = ['local', 'sync', 'managed'];
  if (!storageTypes.includes(storageType)) {
    throw new Error('Wrong storage type');
  }
}

/**
 *
 * @param {string} key
 * @param {string} [defaultValue] - The value to return if the key is not found
 * @param {string} [storageType="local"]
 *
 * @returns {Promise} The value that was retrieved from storage
 */
async function getFromStorage(
    key,
    defaultValue = 'None',
    storageType = 'local'
) {
  assertStorageType(storageType);

  /** @type {Object<string, (string | array | object)>} */
  const result = await browser.storage[storageType].
    get({ [key]: defaultValue });
  return result[key];
}

/**
 * @param {string} key
 * @param {(string | Array | Object)} value - value is converted to JSON
 *    internally
 * @param {string} [storageType="local"]
 */
function setToStorage(key, value, storageType = 'local') {
  assertStorageType(storageType);
  browser.storage[storageType].set({ [key]: value });
}
