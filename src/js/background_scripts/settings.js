import * as announcer from '../modules/announcer.js';

function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.runtime.onMessage.addListener(message => {
    if (message.destination === 'settings' &&
        message.data === 'settings_updated') {
      announcer.checkFiles();
    }
  });
}

main();
