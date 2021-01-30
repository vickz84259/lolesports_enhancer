import * as announcer from '../modules/announcer';

interface Message {
  // The background script meant to receive a particular message
  destination: string;
  data: string; // The data to be sent
}


function main() {
  browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  browser.runtime.onMessage.addListener((msg: any) => {
    if ((msg as Message).destination === 'settings' &&
        (msg as Message).data === 'settings_updated') {
      announcer.checkFiles();
    }
  });
}

main();
