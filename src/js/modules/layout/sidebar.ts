import * as mutation from '../DOM/mutation';
import * as layout from './utils';
import * as storage from '../storage/simple';
import { getElementBySelector, getElementById } from '../DOM/utils';
import { MAX_VIDEO_SIZE } from '../storage/keys';
import { getSVG } from '../utils/resources';
import type { TabState } from '../link_state';

export { init };


// Keeps track of whether a listener has been added to a layout option or not
const LISTENERS_STATE: Map<string, boolean> = new Map();

/**
 * Adds a click event listener based on the layout type.
 */
function addListener(eventTarget: EventTarget, layoutType: string) {
  const listenerState = typeof LISTENERS_STATE.get(layoutType) !== 'undefined';
  if (!listenerState) {
    eventTarget.addEventListener('click', () => changeLayout(layoutType));
    if (!layout.isRightSB(layoutType)) LISTENERS_STATE.set(layoutType, true);
  }
}


async function getSideBarWidth() {
  const sideBar = await getElementBySelector('.overview-pane');
  return parseInt(window.getComputedStyle(sideBar).width, 10);
}


async function getVideoPlayerWidth() {
  const videoPlayer = await getElementById('video-player');
  return parseInt(videoPlayer.style.width, 10);
}


function getMaxVideoWidth() {
  return storage.get(MAX_VIDEO_SIZE) as Promise<number>;
}


/**
 * Moves the sidebar either to the top or the bottom section
 *
 * @param newLayout - the new layout that the UI should be changed into
 */
async function moveSideBar(newLayout: string) {
  let parent: HTMLElement | null = null;
  let sibling: HTMLElement | null = null;

  if (layout.isRightSB(newLayout)) {
    // move the sidebar from the bottom to the top
    sibling = document.querySelector('.center-pane');
    parent = document.querySelector('.Watch.large');

  } else if (layout.isTheatre(newLayout)) {
    // move the sidebar from the top to the bottom
    sibling = document.querySelector('.lower .nav-details');
    parent = document.querySelector('.center-pane .lower');
  }

  const sideBar = document.querySelector('.overview-pane')! as HTMLElement;
  parent!.insertBefore(sideBar, sibling);

  // Moving the sidebar requires the video player to be resized accordingly

  const videoWidth = await getVideoPlayerWidth();
  const sideBarWidth = await getSideBarWidth();
  const videoPlayer = document.getElementById('video-player')!;

  if (layout.isRightSB(newLayout)) {
    // reduce size of video player
    videoPlayer.style.width = `${videoWidth - sideBarWidth}px`;

  } else if (layout.isTheatre(newLayout)) {
    // increase size of video player
    const videoPlayerWidth = (videoWidth + sideBarWidth);
    if (videoPlayerWidth <= (await getMaxVideoWidth())) {
      videoPlayer.style.width = `${videoPlayerWidth}px`;
    }
  }
}

/**
 * @param newLayout - the new layout that the UI should be changed into
 * @param init - Check used to determine if the layout change is part
 *    of the initialisation process.
 */
async function changeLayout(newLayout: string, init = false) {
  const currentLayout = await layout.getCurrent();
  if (layout.isLeftSB(newLayout) || layout.isRightSB(newLayout)) {
    // Move the sidebar from the bottom to the top
    if (layout.isTheatre(currentLayout)) moveSideBar(newLayout);

    if (currentLayout !== newLayout || init) {
      // move the side bar left or right
      const isLeftSB = layout.isLeftSB(newLayout);
      const flex = (isLeftSB) ?
        'flex-direction: row;' : 'flex-direction: row-reverse;';

      document.querySelector('.Watch.large')!.setAttribute('style', flex);

      // move the video player to the left or right
      const videoPlayer = document.getElementById('video-player')!;
      const videoLeftStyle = `${await getSideBarWidth()}px`;
      videoPlayer.style.left = (isLeftSB) ? videoLeftStyle : '0px';
    }
  } else {
    // move the sidebar from the top to the bottom
    if (layout.isRightSB(currentLayout)) moveSideBar(newLayout);
  }

  if (layout.isRightSB(newLayout) && !init) {
    // close the options button
    // The init flag prevents this from opening the options button
    (document.querySelector('.options-button')! as HTMLElement).click();
  }

  layout.setCurrent(newLayout);
}


/**
 * Adds the Sidebar Right option to the UI list of layout options
 */
async function setExtraOption() {
  for (const element of layout.getOptions()) {
    const firstChild = element.firstChild!;
    if (firstChild.textContent === 'Sidebar') {
      // Renaming the previous option as Sidebar Left
      firstChild.textContent = layout.Layouts.SIDEBAR_LEFT;
      addListener(element, layout.Layouts.SIDEBAR_LEFT);
    }
  }

  // Creating the extra layout option (Sidebar Right)
  const newOption = document.createElement('li');
  newOption.setAttribute('class', 'option');

  const label = document.createElement('span');
  label.setAttribute('class', 'label');
  label.textContent = layout.Layouts.SIDEBAR_RIGHT;

  newOption.appendChild(label);
  layout.getOptionsList().appendChild(newOption);

  const sidebarSVG = await getSVG('img/right_sidebar.svg');
  // @ts-ignore
  newOption.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sidebarSVG));

  addListener(newOption, layout.Layouts.SIDEBAR_RIGHT);
}


/**
 * Sets up the MutationObserver that checks on whether the user has selected the
 * option to change the layout.
 */
async function getLayoutObserver() {
  const observer = new MutationObserver(async records => {
    for (const _ of mutation.addedRecordsIterator(records, 'WatchOptionsLayout')
    ) {
      // eslint-disable-next-line no-await-in-loop
      await setExtraOption();

      // Add eventListener to theatre option
      for (const option of layout.getOptions()) {
        if (layout.isTheatre(option.firstChild!.textContent!)) {
          addListener(option, layout.Layouts.THEATRE);
        }
      }

      // Set UI for currently selected layout
      // This is needed when the right sidebar is the selected option
      // eslint-disable-next-line no-await-in-loop
      const currentLayout = await layout.getCurrent();
      if (layout.isRightSB(currentLayout)) {
        // remove the previously selected option
        layout.getSelectedOption().classList.remove('selected');

        // Set the Right sidebar option as the selected one.
        for (const option of layout.getOptions()) {
          if (option.firstChild!.textContent === currentLayout) {
            option.classList.add('selected');
          }
        }
      }
    }
  });

  const targetElement = getElementBySelector('.Watch.large');
  const config = { childList: true, subtree: true };

  observer.observe((await targetElement), config);
  return observer;
}

/**
 * The initialisation function
 */
async function init(tabState: TabState) {
  const result = await storage.get(MAX_VIDEO_SIZE);
  if (result === 'None') {
    // Setup the max video player size
    const currentLayout = await layout.getCurrent();
    const notTheatre = layout.isLeftSB(currentLayout) ||
      layout.isRightSB(currentLayout);

    let value = (notTheatre) ? (await getSideBarWidth()) : 0;
    value += (await getVideoPlayerWidth());
    storage.set(MAX_VIDEO_SIZE, value);
  }

  const observer = await getLayoutObserver();
  tabState.addObserver(observer);

  // Change the layout to the Right sidebar if it is the user's current option
  const savedLayout = await layout.getCurrent();
  const displayedLayout = await layout.getCurrent(false);
  if (layout.isRightSB(savedLayout)) {
    if (layout.isTheatre(displayedLayout)) moveSideBar(savedLayout);
    changeLayout(savedLayout, true);
  }
}
