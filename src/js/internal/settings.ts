import * as storage from '../modules/storage/simple';
import * as keys from '../modules/storage/keys';

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
};

/**
 * Enables/disables the various form elements based on whether the user enables/
 * disables the announcer settings.
 */
function toggle(event: MouseEvent): void {
  for (const id of IDS) {
    const element = document.getElementById(id)!;

    const target = event.target as HTMLInputElement;
    if (target.checked) {
      element.removeAttribute('disabled');
    } else {
      element.setAttribute('disabled', '');
    }
  }
}

document.getElementById('toggle')!.addEventListener('click', toggle);

for (const announcerId of IDS.slice(0, 5)) {
  document.getElementById(announcerId)!.addEventListener('click', () => {

    const options = document.getElementById('locale')!.children;

    for (const option of Array.from(options as HTMLOptionsCollection)) {
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
    document.getElementById('locale')!.appendChild(option);
  });
}


function save(event: Event): void {
  const announcerToggle = (document.
    getElementById('toggle') as HTMLInputElement).checked;
  storage.set(keys.ANNOUNCER, announcerToggle);

  if (announcerToggle) {
    const announcerSelector = 'input[name="announcer"]:checked';
    const announcerType = (document.
      querySelector(announcerSelector) as HTMLInputElement).value;

    if (announcerType !== currentSettings.announcerType) {
      currentSettings.announcerType = announcerType;
      currentSettings.changed = true;

      storage.set(keys.ANNOUNCER_TYPE, announcerType);
    }

    const locale = (document.
      getElementById('locale') as HTMLInputElement).value;
    if (locale !== currentSettings.locale) {
      currentSettings.locale = locale;
      currentSettings.changed = true;

      storage.set(keys.ANNOUNCER_LANG, locale);
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

document.querySelector('form')!.addEventListener('submit', save);

async function setValues() {
  let announcerToggle = (await storage.get(keys.ANNOUNCER)) as string | boolean;
  if (announcerToggle === 'None') {
    announcerToggle = false;
    storage.set(keys.ANNOUNCER, announcerToggle);
  }

  if (announcerToggle) {
    document.getElementById('toggle')!.click();

    const announcerType = (await storage.get(keys.ANNOUNCER_TYPE)) as string;
    currentSettings.announcerType = announcerType;
    (document.getElementById(announcerType) as HTMLInputElement).checked = true;

    const locale = (await storage.get(keys.ANNOUNCER_LANG)) as string;
    currentSettings.locale = locale;
    (document.getElementById('locale') as HTMLInputElement).value = locale;
  }
}

document.addEventListener('DOMContentLoaded', setValues);
