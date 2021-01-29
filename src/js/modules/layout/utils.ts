import * as storage from '../storage/simple';
import { getElementBySelector } from '../DOM/utils';


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
 * @returns the layout name
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
 * @param fromStorage - Determines whether the layout setting to be
 *    gotten from the previously saved settings or determined from the layout
 *    that is currently on display
 *
 * @returns the layout name
 */
async function getCurrentLayout(fromStorage = true) {
  if (!fromStorage) return _getCurrentLayout();

  let layout = await storage.get('layout') as string;
  if (layout === 'None') {
    layout = await _getCurrentLayout();
    setCurrentLayout(layout);
  }
  return layout;
}


/**
 * Save the current layout setting to storage
 *
 * @param layout - The layout currently selected
 */
function setCurrentLayout(layout: string) {
  if (Object.values(Layouts).includes(layout)) {
    storage.set('layout', layout);
  } else {
    throw new Error('Incorrect layout type given');
  }
}


const getOptionsList = () => (
  document.querySelector('.layouts.options-list')! as HTMLElement);


/**
 * Generator that yields the layout options available to the user
 */
function* getOptions() {
  for (const option of getOptionsList().children) {
    yield option as HTMLElement;
  }
}


function getSelectedOption() {
  let result: HTMLElement | null = null;
  for (const option of getOptions()) {
    if (option.classList.contains('selected')) {
      result = option;
      break;
    }
  }

  return result!; // Verify this
}

const isLeftSB = (layout: string) => layout === Layouts.SIDEBAR_LEFT;

const isRightSB = (layout: string) => layout === Layouts.SIDEBAR_RIGHT;

const isTheatre = (layout: string) => layout === Layouts.THEATRE;


/**
 * This function assumes the layout passed is either the left or the right
 * sidebar.
*/
function getOppositeLayout(layout: string) {
  return (isLeftSB(layout)) ? Layouts.SIDEBAR_RIGHT : Layouts.SIDEBAR_LEFT;
}

export {
  getCurrentLayout as getCurrent,
  setCurrentLayout as setCurrent,
  getOppositeLayout as getOpposite,
  Layouts, getSelectedOption, getOptions, getOptionsList, isLeftSB, isRightSB,
  isTheatre,
};
