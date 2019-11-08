export { getFromStorage, setToStorage, createNotification };

function assertStorageType(storageType) {
  const storageTypes = ['local', 'sync', 'managed'];
  if (!storageTypes.includes(storageType)) throw new Error('Wrong storage type');
}

async function getFromStorage(key, defaultValue = 'None', storageType = 'local') {
  /* beautify preserve:start */
  assertStorageType(storageType);
  let result = await browser.storage[storageType].get({ [key]: defaultValue });
  return result[key];
  /* beautify preserve:end */
}

function setToStorage(key, value, storageType = 'local') {
  /* beautify preserve:start */
  assertStorageType(storageType);
  browser.storage[storageType].set({ [key]: value });
  /* beautify preserve:end */
}

async function createNotification(message) {
  return (await browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('img/logo_48.png'),
    title: 'LOL Esports Enhancer',
    message
  }));
}