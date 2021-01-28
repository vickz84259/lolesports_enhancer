const iconUrl = browser.runtime.getURL('img/logo_48.png');
const title = 'LoL Esports Enhancer';

function createNotification(message: string) {
  browser.notifications.create({ type: 'basic', iconUrl, title, message });
}

interface Message {
  // The background script meant to receive a particular message
  destination: string
  data: string // The data to be sent
}


function main() {
  browser.runtime.onMessage.addListener((msg: any) => {
    if ((msg as Message).destination === 'notification') {
      createNotification(msg.data);
    }
  });
}

main();

export {};
