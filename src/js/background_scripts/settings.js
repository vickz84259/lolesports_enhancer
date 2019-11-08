import * as keys from '../modules/keys.js';
import * as announcer from '../modules/announcer.js';
import { getFromStorage, createNotification } from '../modules/utils.js';

function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.storage.onChanged.addListener(async (changes) => {
    if (keys.ANNOUNCER in changes && changes[keys.ANNOUNCER].newValue) {
      let announcerType = await getFromStorage(keys.ANNOUNCER_TYPE);
      let locale = await getFromStorage(keys.ANNOUNCER_LANG);
      let missingFiles = await announcer.getMissingFileNames(announcerType, locale);

      if (missingFiles.length > 1) {
        let notificationId = createNotification('Downloading audio files');

        await announcer.downloadFiles(missingFiles);

        browser.notifications.clear((await notificationId));
        createNotification('Audio files downloaded successfully');
      }
    }
  });
}

main();