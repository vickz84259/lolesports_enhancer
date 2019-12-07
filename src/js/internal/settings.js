import * as utils from '../modules/utils.js';
import * as keys from '../modules/keys.js';

/** @type {string[]} */
const IDS = [
  'Announcer_Global_Ahri',
  'Announcer_Global_Female1',
  'Announcer_Global_Female1project',
  'Announcer_Global_Male',
  'Announcer_Global_Thresh',
  'locale'
];

/** @type {{changed: boolean, announcerType: string, locale: string}} */
const currentSettings = {
  changed: false,
  announcerType: '',
  locale: '',
};


/**
 * Enables/disables the various form elements based on whether the user enables/
 * disables the announcer settings.
 *
 * @param {MouseEvent} event
 */
function toggle(event) {
  for (const id of IDS) {
    const element = document.getElementById(id);

    /** @type {HTMLInputElement} */
    const target = (event.target);
    if (target.checked) {
      element.removeAttribute('disabled');
    } else {
      element.setAttribute('disabled', '');
    }
  }
}

document.getElementById('toggle').addEventListener('click', toggle);

for (const announcerId of IDS.slice(0, 5)) {
  document.getElementById(announcerId).addEventListener('click', () => {

    /** @type {HTMLOptionsCollection} */
    const options = (document.getElementById('locale').children);

    for (const option of options) {
      if (option.value === 'zh_CN') {
        if (announcerId === 'Announcer_Global_Thresh') {
          // Removing the chinese option since it's not available
          option.remove();
        }
        return;
      }
    }

    // Restoring the Chinese option for other announcer types if it isn't there
    const option = document.createElement('option');
    option.value = 'zh_CN';
    option.textContent = 'Chinese';
    document.getElementById('locale').appendChild(option);
  });
}

/** @param {Event} event */
function save(event) {
  const announcerToggle = /** @type {HTMLInputElement} */ (document.
    getElementById('toggle')).checked;
  utils.setToStorage(keys.ANNOUNCER, announcerToggle);

  if (announcerToggle) {
    const announcerSelector = 'input[name="announcer"]:checked';
    const announcerType = /** @type {HTMLInputElement} */ (document.
      querySelector(announcerSelector)).value;

    if (announcerType !== currentSettings.announcerType) {
      currentSettings.announcerType = announcerType;
      currentSettings.changed = true;

      utils.setToStorage(keys.ANNOUNCER_TYPE, announcerType);
    }

    const locale = /** @type {HTMLInputElement} */ (document.
      getElementById('locale')).value;
    if (locale !== currentSettings.locale) {
      currentSettings.locale = locale;
      currentSettings.changed = true;

      utils.setToStorage(keys.ANNOUNCER_LANG, locale);
    }

    if (currentSettings.changed) {
      currentSettings.changed = false; // Reset the flag.

      browser.runtime.sendMessage({
        destination: 'settings',
        data: 'settings_updated'
      });
    }
  }

  browser.runtime.sendMessage({
    destination: 'notification',
    data: 'Your settings have been saved'
  });

  // Prevent the page from refreshing.
  event.preventDefault();
}

document.querySelector('form').addEventListener('submit', save);

async function setValues() {
  /** @type {string | boolean} */
  let announcerToggle = await utils.getFromStorage(keys.ANNOUNCER);
  if (announcerToggle === 'None') {
    announcerToggle = false;
    utils.setToStorage(keys.ANNOUNCER, announcerToggle);
  }

  if (announcerToggle) {
    document.getElementById('toggle').click();

    const announcerType = await utils.getFromStorage(keys.ANNOUNCER_TYPE);
    currentSettings.announcerType = announcerType;
    /** @type {HTMLInputElement} */ (document.getElementById(announcerType)).
      checked = true;

    const locale = await utils.getFromStorage(keys.ANNOUNCER_LANG);
    currentSettings.locale = locale;
    /** @type {HTMLInputElement} */ (document.getElementById('locale')).
      value = locale;
  }
}

document.addEventListener('DOMContentLoaded', setValues);
