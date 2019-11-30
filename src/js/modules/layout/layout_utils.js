import { getFromStorage, setToStorage } from '../utils.js';
import { getElementBySelector } from '../DOM_utils.js';


/* Creating an Enum to hold the various layout options.
  This will be achieved by freezing an object */
const Layouts = Object.freeze({
  SIDEBAR_LEFT: 'Sidebar Left',
  THEATRE: 'Theater',
  SIDEBAR_RIGHT: 'Sidebar Right'
});


async function _getCurrentLayout() {
  // Retrieves the current layout being displayed
  let mainArea = await getElementBySelector('.Watch.large');
  if (mainArea.children.length === 2) {
    let style = window.getComputedStyle(mainArea);
    let flexDirection = style.getPropertyValue('flex-direction');

    return (flexDirection === 'row-reverse') ?
      Layouts.SIDEBAR_RIGHT : Layouts.SIDEBAR_LEFT;
  }

  return Layouts.THEATRE;
}

async function getCurrentLayout(fromStorage = true) {
  if (!fromStorage) return _getCurrentLayout();

  let layout = await getFromStorage('layout');
  if (layout === 'None') {
    layout = await _getCurrentLayout();
    setCurrentLayout(layout);
  }
  return layout;
}

function setCurrentLayout(layout) {
  if (Object.values(Layouts).includes(layout)) {
    setToStorage('layout', layout);
  } else {
    throw new Error('Incorrect layout type given');
  }
}

let getOptionsList = () => document.querySelector('.layouts.options-list');

function* getOptions() {
  for (let option of getOptionsList().children) {
    yield option;
  }
}

function getSelectedOption() {
  let result = null;
  for (let option of getOptions()) {
    if (option.classList.contains('selected')) {
      result = option;
      break;
    }
  }

  return result;
}

let isLeftSB = layout => layout === Layouts.SIDEBAR_LEFT;
let isRightSB = layout => layout === Layouts.SIDEBAR_RIGHT;
let isTheatre = layout => layout === Layouts.THEATRE;

function getOppositeLayout(layout) {
  return (isLeftSB(layout)) ? Layouts.SIDEBAR_RIGHT : Layouts.SIDEBAR_LEFT;
}

export {
  getCurrentLayout as getCurrent,
  setCurrentLayout as setCurrent,
  getOppositeLayout as getOpposite,
  Layouts, getSelectedOption, getOptions, getOptionsList, isLeftSB, isRightSB,
  isTheatre,
};
