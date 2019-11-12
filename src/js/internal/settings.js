import * as utils from '../modules/utils.js';
import * as keys from '../modules/keys.js';

const IDS = [
  'Announcer_Global_Ahri',
  'Announcer_Global_Female1',
  'Announcer_Global_Female1project',
  'Announcer_Global_Male',
  'Announcer_Global_Thresh',
  'locale'
];

const currentSettings = {
  changed: false,
  announcerType: '',
  locale: '',
}

function toggle(event) {
  for (let id of IDS) {
    let element = document.getElementById(id);
    if (event.target.checked) {
      element.removeAttribute('disabled');
    } else {
      element.setAttribute('disabled', '');
    }
  }
}

document.getElementById('toggle').addEventListener('click', toggle);

for (let announcerId of IDS.slice(0, 5)) {
  document.getElementById(announcerId).addEventListener('click', () => {
    let options = document.getElementById('locale').children;

    for (let option of options) {
      if (option.value === 'zh_CN') {
        if (announcerId === 'Announcer_Global_Thresh') {
          // Removing the chinese option since it's not available
          option.remove();
        }
        return;
      }
    }

    // Restoring the Chinese option for other announcer types if it isn't there
    let option = document.createElement('option');
    option.value = 'zh_CN';
    option.textContent = 'Chinese';
    document.getElementById('locale').appendChild(option);
  });
}


function save(event) {
  let announcerToggle = document.getElementById('toggle').checked;
  utils.setToStorage(keys.ANNOUNCER, announcerToggle);

  if (announcerToggle) {
    let announcerType = document.querySelector('input[name="announcer"]:checked').value;
    if (announcerType !== currentSettings.announcerType) {
      currentSettings.announcer = announcerType;
      currentSettings.changed = true;

      utils.setToStorage(keys.ANNOUNCER_TYPE, announcerType);
    }

    let locale = document.getElementById('locale').value;
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
  let announcerToggle = await utils.getFromStorage(keys.ANNOUNCER);
  if (announcerToggle === 'None') {
    announcerToggle = false;
    utils.setToStorage(keys.ANNOUNCER, announcerToggle);
  }

  if (announcerToggle) {
    document.getElementById('toggle').click();

    let announcerType = await utils.getFromStorage(keys.ANNOUNCER_TYPE);
    currentSettings.announcerType = announcerType;
    document.getElementById(announcerType).checked = true;

    let locale = await utils.getFromStorage(keys.ANNOUNCER_LANG);
    currentSettings.locale = locale;
    document.getElementById('locale').value = locale;
  }
}

document.addEventListener('DOMContentLoaded', setValues);