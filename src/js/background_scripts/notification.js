const iconUrl = browser.runtime.getURL('img/logo_48.png');
const title = 'LoL Esports Enhancer';

function createNotification(message) {
  browser.notifications.create({ type: 'basic', iconUrl, title, message });
}

function main() {
  browser.runtime.onMessage.addListener(msg => {
    if (msg.destination === 'notification') {
      createNotification(msg.data);
    }
  });
}

main();
