import * as storage from './storage.js';

const BASEURL = 'https://d3t82zuq6uoshl.cloudfront.net/';

async function* getFileNames(announcerType, locale) {
  let url = browser.runtime.getURL(`json/${announcerType}.json`);
  let response = await (await fetch(url)).json();

  let fileNumbers = Object.values(response.categories);
  let fileNoSet = new Set([].concat(...fileNumbers));

  for (let num of fileNoSet) {
    let padded = num.toString().padStart(4, 0);
    let fileName = `File${padded}.mp3`;

    yield `${announcerType}/${locale}/${fileName}`;
  }
}

export async function getMissingFileNames(announcerType, locale) {
  let savedFiles = await storage.getAllKeys();

  let missingFiles = [];
  for await (let fileName of getFileNames(announcerType, locale)) {
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

export async function downloadFiles(fileNamesIterator) {
  let db = await storage.getDB();

  for (let fileName of fileNamesIterator) {
    download(fileName, db);
  }
}