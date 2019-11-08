import * as keys from '../modules/keys.js';
import * as announcer from '../modules/announcer.js';

function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.storage.onChanged.addListener(async (changes) => {
    if (keys.ANNOUNCER in changes && changes[keys.ANNOUNCER].newValue) {
      announcer.downloadMissingFiles(true);
    }
  });
}

main();