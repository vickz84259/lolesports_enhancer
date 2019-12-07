const iconUrl = browser.runtime.getURL('img/logo_48.png');
const title = 'LoL Esports Enhancer';

/** @param {string} message */
function createNotification(message) {
  browser.notifications.create({ type: 'basic', iconUrl, title, message });
}

/**
 * @typedef {object} Message
 * @property {string} destination - The background script meant to receive a
 *    particular message
 * @property {string} data - The data to be sent
 */

function main() {
  browser.runtime.onMessage.addListener(/** @param {Message} msg */msg => {
    if (msg.destination === 'notification') {
      createNotification(msg.data);
    }
  });
}

main();
