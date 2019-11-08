import * as utils from '../modules/utils.js';
import * as keys from '../modules/keys.js';

const IDS = [
  'Announcer_Global_Ahri',
  'Announcer_Global_Female1',
  'Announcer_Global_Female1project',
  'Announcer_Global_Male',
  'Announcer_Global_Thresh',
  'language'
];

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
    let options = document.getElementById('language').children;

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
    document.getElementById('language').appendChild(option);
  });
}

function save(event) {
  let announcerToggle = document.getElementById('toggle');
  if (announcerToggle.checked) {
    // Save the other keys first to ensure they are available for the background script
    let checkedRadio = document.querySelector('input[name="announcer"]:checked');
    utils.setToStorage(keys.ANNOUNCER_TYPE, checkedRadio.value);

    let language = document.getElementById('language').value;
    utils.setToStorage(keys.ANNOUNCER_LANG, language);
  }

  utils.setToStorage(keys.ANNOUNCER, announcerToggle.checked);

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
    document.getElementById(announcerType).checked = true;

    let language = await utils.getFromStorage(keys.ANNOUNCER_LANG);
    document.getElementById('language').value = language;
  }
}

document.addEventListener('DOMContentLoaded', setValues);