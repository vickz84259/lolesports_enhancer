import * as storage from './storage.js';
import * as keys from './keys.js';
import { getFromStorage } from './utils.js';
import { getJson } from './resources.js';

const BASEURL = 'https://d3t82zuq6uoshl.cloudfront.net/';


function getPaddedFileName(fileNumber) {
  /* Pads a fileName with the appropriate number of zeros

  Args:
    fileNumber: Integer representing the file number

  Returns:
    A string representing the fileName with the padded file number
  */
  let padded = fileNumber.toString().padStart(4, 0);
  return `File${padded}.mp3`;
}


async function* getFileNames(announcerType, locale) {
  let response = await getJson(`json/${announcerType}.json`);

  let fileNumbers = Object.values(response.categories);
  let fileNoSet = new Set([].concat(...fileNumbers));

  for (let num of fileNoSet) {
    let fileName = getPaddedFileName(num);
    yield `${announcerType}/${locale}/${fileName}`;
  }
}


async function download(fileName, db = null) {
  let url = `${BASEURL}${fileName}`;
  let audioFile = await (await fetch(url)).arrayBuffer();

  if (!db) db = (await storage.getDB());
  await storage.add(db, audioFile, fileName);
}


async function getAnnouncerSettings() {
  let announcerType = await getFromStorage(keys.ANNOUNCER_TYPE);
  let locale = await getFromStorage(keys.ANNOUNCER_LANG);

  return { announcerType, locale };
}


export async function checkFiles() {
  let db = await storage.getDB();
  let savedFiles = await storage.getAllKeys(db);

  let promises = [];

  let settings = await getAnnouncerSettings();
  let fileNames = getFileNames(settings.announcerType, settings.locale);
  for await (let fileName of fileNames) {
    if (!(savedFiles.includes(fileName))) {
      console.log(`downloading ${fileName}`);
      promises.push(download(fileName, db));
    }
  }

  await Promise.all(promises);
}


export async function getScenarios() {
  let settings = await getAnnouncerSettings();
  let response = await getJson(`json/${settings.announcerType}.json`);
  let scenarios = response.categories;

  for (let key in scenarios) {
    scenarios[key] = scenarios[key].map(item => {
      let fileName = getPaddedFileName(item);
      return `${settings.announcerType}/${settings.locale}/${fileName}`;
    });
  }
  return scenarios;
}


export async function* getAudioFiles() {
  let db = await storage.getDB();

  let settings = await getAnnouncerSettings();
  let fileNames = getFileNames(settings.announcerType, settings.locale);
  for await (let fileName of fileNames) {
    let data = await storage.get(db, fileName);
    yield { fileName, data };
  }
}
