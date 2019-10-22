import { getFromStorage, setToStorage } from '../utils.js';
import { getElementBySelector } from '../DOM_utils.js';

export { getCurrentLayout, setCurrentLayout, Layouts };

/* Creating an Enum to hold the various layout options.
  This will be achieved by freezing an object */
const Layouts = Object.freeze({
  SIDEBAR_LEFT: 'Sidebar Left',
  THEATRE: 'Theater',
  SIDEBAR_RIGHT: 'Sidebar Right'
});

async function getCurrentLayout() {
  let result = await getFromStorage('layout');
  if (result.layout === 'None') {
    let mainArea = await getElementBySelector('.Watch.large');
    let noOfChildren = mainArea.children.length;

    let layout = (noOfChildren === 2) ? Layouts.SIDEBAR_LEFT : Layouts.THEATRE;
    setCurrentLayout(layout);

    result = { layout };
  }
  return result.layout;
}

function setCurrentLayout(layout) {
  if (Object.values(Layouts).includes(layout)) {
    setToStorage('layout', layout);
  } else {
    throw new Error('Incorrect layout type given');
  }
}