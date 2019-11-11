import * as keys from '../modules/keys.js';
import * as announcer from '../modules/announcer.js';
import { createNotification } from '../modules/utils.js';

function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.destination === 'settings' && message.data === 'settings_updated') {
      announcer.checkFiles();
    }
  });

  browser.storage.onChanged.addListener(async (changes) => {
    if (keys.ALLY_TEAMS in changes) {
      if (changes[keys.ALLY_TEAMS].newValue.length > 1) {
        let team = changes[keys.ALLY_TEAMS].newValue[0];
        createNotification(`${team} choosen as ally team`);
      }
    }
  });
}

main();