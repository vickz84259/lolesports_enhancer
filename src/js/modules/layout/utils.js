import * as storage from '../storage/simple.js';
import { getElementBySelector } from '../DOM/utils.js';


/* Creating an Enum to hold the various layout options.
  This will be achieved by freezing an object */
const Layouts = Object.freeze({
  SIDEBAR_LEFT: 'Sidebar Left',
  THEATRE: 'Theater',
  SIDEBAR_RIGHT: 'Sidebar Right'
});


/**
 * Retrieves the current layout being displayed
 *
 * @returns {Promise<string>} the layout name
 */
async function _getCurrentLayout() {
  const mainArea = await getElementBySelector('.Watch.large');
  if (mainArea.children.length === 2) {
    const style = window.getComputedStyle(mainArea);
    const flexDirection = style.getPropertyValue('flex-direction');

    return (flexDirection === 'row-reverse') ?
      Layouts.SIDEBAR_RIGHT : Layouts.SIDEBAR_LEFT;
  }

  return Layouts.THEATRE;
}


/**
 * @param {boolean} fromStorage - Determines whether the layout setting to be
 *    gotten from the previously saved settings or determined from the layout
 *    that is currently on display
 *
 * @returns {Promise<string>} the layout name
 */
async function getCurrentLayout(fromStorage = true) {
  if (!fromStorage) return _getCurrentLayout();

  /** @type {string} */
  let layout = await storage.get('layout');
  if (layout === 'None') {
    layout = await _getCurrentLayout();
    setCurrentLayout(layout);
  }
  return layout;
}


/**
 * Save the current layout setting to storage
 *
 * @param {string} layout - The layout currently selected
 */
function setCurrentLayout(layout) {
  if (Object.values(Layouts).includes(layout)) {
    storage.set('layout', layout);
  } else {
    throw new Error('Incorrect layout type given');
  }
}

/** @returns {HTMLElement} */
const getOptionsList = () => document.querySelector('.layouts.options-list');


/**
 * Generator that yields the layout options available to the user
 *
 * @yields {HTMLElement}
 * @returns {Generator<HTMLElement,any,unknown>}
 */
function* getOptions() {
  for (const option of getOptionsList().children) {
    yield /** @type {HTMLElement} */ (option);
  }
}

/** @returns {HTMLElement} */
function getSelectedOption() {
  /** @type {?HTMLElement} */
  let result = null;
  for (const option of getOptions()) {
    if (option.classList.contains('selected')) {
      result = option;
      break;
    }
  }

  return result;
}

/** @param {string} layout */
const isLeftSB = layout => layout === Layouts.SIDEBAR_LEFT;

/** @param {string} layout */
const isRightSB = layout => layout === Layouts.SIDEBAR_RIGHT;

/** @param {string} layout */
const isTheatre = layout => layout === Layouts.THEATRE;


/**
 * This function assumes the layout passed is either the left or the right
 * sidebar.
 *
 * @param {string} layout
 *
 * @returns {string}
*/
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
