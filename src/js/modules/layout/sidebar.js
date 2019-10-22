import * as mutation from '../mutation.js';
import { getElementBySelector, getElementById } from '../DOM_utils.js';
import { getCurrentLayout, setCurrentLayout, Layouts } from './layout_utils.js';

export { setUpLayoutObserver };


let getOptionsList = () => getElementBySelector('.layouts.options-list');

async function* getOptions() {
  let optionsList = await getOptionsList();
  for (let option of optionsList.childNodes) {
    yield option;
  }
}

async function getSelectedOption() {
  for await (let option of getOptions()) {
    if (option.classList.contains('selected')) {
      return option;
    }
  }
}

async function getSBLayoutHandler(layout) {
  let videoPlayer = await getElementById('video-player');
  const leftStyle = videoPlayer.style.left;

  const isLeftSB = layout === Layouts.SIDEBAR_LEFT;

  return async function(event) {
    // function that gets called when a sidebar layout option is clicked
    let option = await getSelectedOption();
    let oppositeLayout = (isLeftSB) ? Layouts.SIDEBAR_RIGHT : Layouts.SIDEBAR_LEFT;
    if (option.firstChild.textContent === oppositeLayout) {

      // move the side bar left or right
      let mainArea = await getElementBySelector('.Watch.large');
      let flex = (isLeftSB) ? 'flex-direction: row;' : 'flex-direction: row-reverse;';
      mainArea.setAttribute('style', flex);

      // move the video player to the left or right
      videoPlayer = await getElementById('video-player');
      videoPlayer.style.left = (isLeftSB) ? leftStyle : '0px';
      videoPlayer = null;

      // change the layout options UI
      option.classList.remove('selected');
      event.currentTarget.classList.add('selected');
      setCurrentLayout(layout);
    }
  }

}

async function setExtraOption() {
  for await (let element of getOptions()) {
    let firstChild = element.firstChild;
    if (firstChild.textContent === 'Sidebar') {
      // Renaming the previous option as Sidebar Left
      firstChild.textContent = Layouts.SIDEBAR_LEFT;

      let handler = await getSBLayoutHandler(Layouts.SIDEBAR_LEFT);
      element.addEventListener('click', handler);
    }
  }

  // Creating the extra layout option (Sidebar Right)
  let newOption = document.createElement('li');
  newOption.setAttribute('class', 'option');

  let label = document.createElement('span');
  label.setAttribute('class', 'label');
  label.textContent = Layouts.SIDEBAR_RIGHT;

  newOption.appendChild(label);
  let optionsList = await getOptionsList();
  optionsList.appendChild(newOption);

  let url = browser.runtime.getURL('src/img/right_sidebar.svg');
  let sidebarSVG = await (await fetch(url)).text();

  newOption.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sidebarSVG));
  let handler = await getSBLayoutHandler(Layouts.SIDEBAR_RIGHT)
  newOption.addEventListener('click', handler);
}

async function setUpLayoutObserver(tabState) {
  // This observer checks if the user has opened the options to switch the stats
  // layout which triggers a mutation.
  tabState.observer = new MutationObserver(async (mutationRecords) => {
    for (let element of mutation.recordsIterator(mutationRecords)) {
      if (element.className === 'WatchOptionsLayout') {
        await setExtraOption();

        // Set UI for currently selected layout
        let currentLayout = await getCurrentLayout();
        for await (let option of getOptions()) {
          if (option.firstChild.textContent === currentLayout) {
            option.classList.add('selected');
          }
        }
      }
    }
  });

  let targetElement = getElementBySelector('.Watch.large');
  let config = { childList: true, subtree: true };
  tabState.observer.observe((await targetElement), config);
}