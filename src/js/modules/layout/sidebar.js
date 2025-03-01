import * as mutation from '../mutation.js';
import * as layout from './layout_utils.js';
import { getElementBySelector, getElementById } from '../DOM_utils.js';
import { getFromStorage, setToStorage } from '../utils.js';
import { MAX_VIDEO_SIZE } from '../keys.js';

export { init };


// The values stored will be of boolean type
const LISTENERS_STATE = new Map();

function addListener(eventTarget, layoutType) {
  // This works even if the value is undefined
  let listenerState = (LISTENERS_STATE.get(layoutType)) ? true : false;
  if (!listenerState) {
    eventTarget.addEventListener('click', () => changeLayout(layoutType));
    if (!layout.isRightSB(layoutType)) LISTENERS_STATE.set(layoutType, true);
  }
}

async function getSideBarWidth() {
  let sideBar = await getElementBySelector('.overview-pane');
  return parseInt(window.getComputedStyle(sideBar).width, 10);
}

async function getVideoPlayerWidth() {
  let videoPlayer = await getElementById('video-player');
  return parseInt(videoPlayer.style.width, 10);
}

async function getMaxVideoWidth() {
  return (await getFromStorage(MAX_VIDEO_SIZE));
}

async function moveSideBar(newLayout) {
  /* The function moves the sidebar either to the top or to the bottom
    This requires the video player to be resized accordingly */

  let parent, sibling;
  if (layout.isRightSB(newLayout)) {
    // move the sidebar from the bottom to the top
    sibling = document.querySelector('.center-pane');
    parent = document.querySelector('.Watch.large');

  } else if (layout.isTheatre(newLayout)) {
    // move the sidebar from the top to the bottom
    sibling = document.querySelector('.lower .nav-details');
    parent = document.querySelector('.center-pane .lower');
  }

  let sideBar = document.querySelector('.overview-pane');
  parent.insertBefore(sideBar, sibling);

  let videoWidth = await getVideoPlayerWidth();
  let sideBarWidth = await getSideBarWidth();
  let videoPlayer = document.getElementById('video-player');

  if (layout.isRightSB(newLayout)) {
    // reduce size of video player
    videoPlayer.style.width = (videoWidth - sideBarWidth) + 'px';

  } else if (layout.isTheatre(newLayout)) {
    // increase size of video player
    let videoPlayerWidth = (videoWidth + sideBarWidth);
    if (videoPlayerWidth <= (await getMaxVideoWidth())) {
      videoPlayer.style.width = videoPlayerWidth + 'px';
    }
  }
}

async function changeLayout(newLayout, init = false) {
  let currentLayout = await layout.getCurrent();
  if (layout.isLeftSB(newLayout) || layout.isRightSB(newLayout)) {
    // Move the sidebar from the bottom to the top
    if (layout.isTheatre(currentLayout)) moveSideBar(newLayout);

    if (currentLayout !== newLayout || init) {
      // move the side bar left or right
      let isLeftSB = layout.isLeftSB(newLayout);
      let flex = (isLeftSB) ? 'flex-direction: row;' : 'flex-direction: row-reverse;';

      document.querySelector('.Watch.large').setAttribute('style', flex);

      // move the video player to the left or right
      let videoPlayer = document.getElementById('video-player');
      let videoLeftStyle = (await getSideBarWidth()) + 'px';
      videoPlayer.style.left = (isLeftSB) ? videoLeftStyle : '0px';
    }
  } else {
    // move the sidebar from the top to the bottom
    if (layout.isRightSB(currentLayout)) moveSideBar(newLayout);
  }

  if (layout.isRightSB(newLayout) && !init) {
    // close the options button
    // The init check prevents from this leading to the options button being opened
    document.querySelector('.options-button').click();
  }

  layout.setCurrent(newLayout);
}

async function setExtraOption() {
  for (let element of layout.getOptions()) {
    let firstChild = element.firstChild;
    if (firstChild.textContent === 'Sidebar') {
      // Renaming the previous option as Sidebar Left
      firstChild.textContent = layout.Layouts.SIDEBAR_LEFT;
      addListener(element, layout.Layouts.SIDEBAR_LEFT);
    }
  }

  // Creating the extra layout option (Sidebar Right)
  let newOption = document.createElement('li');
  newOption.setAttribute('class', 'option');

  let label = document.createElement('span');
  label.setAttribute('class', 'label');
  label.textContent = layout.Layouts.SIDEBAR_RIGHT;

  newOption.appendChild(label);
  layout.getOptionsList().appendChild(newOption);

  let url = browser.runtime.getURL('img/right_sidebar.svg');
  let sidebarSVG = await (await fetch(url)).text();

  newOption.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sidebarSVG));
  addListener(newOption, layout.Layouts.SIDEBAR_RIGHT);
}

async function setUpLayoutObserver() {
  // This observer checks if the user has opened the options to switch the stats
  // layout which triggers a mutation.
  let observer = new MutationObserver(async (mutationRecords) => {
    for (let element of mutation.addedRecordsIterator(mutationRecords)) {
      if (element.className === 'WatchOptionsLayout') {
        await setExtraOption();

        // Add eventListener to theatre option
        for (let option of layout.getOptions()) {
          if (layout.isTheatre(option.firstChild.textContent)) {
            addListener(option, layout.Layouts.THEATRE);
          }
        }

        // Set UI for currently selected layout
        // This is needed when the right sidebar is the selected option
        let currentLayout = await layout.getCurrent();
        if (layout.isRightSB(currentLayout)) {
          // remove the previously selected option
          layout.getSelectedOption().classList.remove('selected');

          // Set the Right sidebar option as the selected one.
          for (let option of layout.getOptions()) {
            if (option.firstChild.textContent === currentLayout) {
              option.classList.add('selected');
            }
          }
        }
      }
    }
  });

  let targetElement = getElementBySelector('.Watch.large');
  let config = { childList: true, subtree: true };

  observer.observe((await targetElement), config);
  return observer;
}

async function init(tabState) {
  let result = await getFromStorage(MAX_VIDEO_SIZE);
  if (result === 'None') {
    // Setup the max video player size
    let currentLayout = await layout.getCurrent();
    let notTheatre = layout.isLeftSB(currentLayout) || layout.isRightSB(currentLayout);

    let value = (notTheatre) ? (await getSideBarWidth()) : 0;
    value += (await getVideoPlayerWidth());
    setToStorage(MAX_VIDEO_SIZE, value);
  }

  let observer = await setUpLayoutObserver();
  tabState.addObserver(observer);

  // Change the layout to the Right sidebar if it is the user's current option
  let savedLayout = await layout.getCurrent();
  let displayedLayout = await layout.getCurrent(false);
  if (layout.isRightSB(savedLayout)) {
    if (layout.isTheatre(displayedLayout)) moveSideBar(savedLayout);
    changeLayout(savedLayout, true);
  }
}