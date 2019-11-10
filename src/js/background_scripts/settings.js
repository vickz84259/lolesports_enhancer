import * as keys from '../modules/keys.js';
import * as announcer from '../modules/announcer.js';
import { createNotification } from '../modules/utils.js';

function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.storage.onChanged.addListener(async (changes) => {
    if (keys.ANNOUNCER in changes && changes[keys.ANNOUNCER].newValue) {
      announcer.checkFiles();
    } else if (keys.ALLY_TEAMS in changes) {
      if (changes[keys.ALLY_TEAMS].newValue.length > 1) {
        let team = changes[keys.ALLY_TEAMS].newValue[0];
        createNotification(`${team} choosen as ally team`);
      }
    }
  });
}

main();