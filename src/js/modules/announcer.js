import * as storage from './storage.js';
import * as keys from './keys.js';
import { getFromStorage, createNotification, setToStorage } from './utils.js';

const BASEURL = 'https://d3t82zuq6uoshl.cloudfront.net/';

async function getJsonResource(path) {
  let url = browser.runtime.getURL(path);
  return (await (await fetch(url)).json());
}

function getPaddedFileName(fileNumber) {
  let padded = fileNumber.toString().padStart(4, 0);
  return `File${padded}.mp3`;
}

async function* getFileNames() {
  let announcerType = await getFromStorage(keys.ANNOUNCER_TYPE);
  let response = await getJsonResource(`json/${announcerType}.json`);

  let fileNumbers = Object.values(response.categories);
  let fileNoSet = new Set([].concat(...fileNumbers));

  let locale = await getFromStorage(keys.ANNOUNCER_LANG);
  for (let num of fileNoSet) {
    let fileName = getPaddedFileName(num);
    yield `${announcerType}/${locale}/${fileName}`;
  }
}

export async function getMissingFileNames() {
  let savedFiles = await storage.getAllKeys();

  let missingFiles = [];
  for await (let fileName of getFileNames()) {
    if (!(savedFiles.includes(fileName))) missingFiles.push(fileName);
  }

  return missingFiles;
}

async function download(fileName, db = null) {
  let url = `${BASEURL}${fileName}`;
  let audioFile = await (await fetch(url)).arrayBuffer();

  if (!db) db = (await storage.getDB());
  await storage.add(db, audioFile, fileName);
}

async function downloadFiles(fileNamesIterator) {
  let db = await storage.getDB();

  for (let fileName of fileNamesIterator) {
    download(fileName, db);
  }
}

export async function downloadMissingFiles(notification = false) {
  let download_ongoing = await getFromStorage('download_ongoing');
  if (download_ongoing === 'None' || !download_ongoing) {
    setToStorage('download_ongoing', true);
  } else {
    return;
  }

  let missingFiles = await getMissingFileNames();

  if (missingFiles.length > 1) {
    if (notification) await createNotification('Downloading audio files');

    await downloadFiles(missingFiles);

    if (notification) await createNotification('Audio files downloaded successfully');
  }

  setToStorage('download_ongoing', false);
}

export async function getScenarios() {
  let announcerType = await getFromStorage(keys.ANNOUNCER_TYPE);
  let response = await getJsonResource(`json/${announcerType}.json`);

  let locale = await getFromStorage(keys.ANNOUNCER_LANG);
  let scenarios = response.categories;
  for (let key in scenarios) {
    scenarios[key] = scenarios[key].map((item) => {
      let fileName = getPaddedFileName(item);
      return `${announcerType}/${locale}/${fileName}`;
    });
  }
  return scenarios;
}

export async function* getAudioFiles() {
  let db = await storage.getDB();

  for await (let fileName of getFileNames()) {
    let data = await storage.get(db, fileName);
    yield { fileName, data };
  }
}