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

async function rightSBLayoutHandler(event) {
  // function that gets called when the right sidebar layout option is clicked
  let option = await getSelectedOption();
  if (option.firstChild.textContent === Layouts.SIDEBAR_LEFT) {
    // move the side bar to the right
    let mainArea = await getElementBySelector('.Watch.large');
    mainArea.setAttribute('style', 'flex-direction: row-reverse;');

    // move the video player to the left
    let videoPlayer = await getElementById('video-player');
    videoPlayer.style.left = '0px';

    // change the layout options UI
    option.classList.remove('selected');
    event.currentTarget.classList.add('selected');
    setCurrentLayout(Layouts.SIDEBAR_RIGHT);
  }
}

async function leftSBLayouthandler(event) {
  // function that gets called when the left sidebar layout option is clicked
  let option = await getSelectedOption();
  if (option.firstChild.textContent === Layouts.SIDEBAR_RIGHT) {
    // move the side bar to the left
    let mainArea = await getElementBySelector('.Watch.large');
    mainArea.setAttribute('style', 'flex-direction: row');

    // move the video player to the right
    let videoPlayer = await getElementById('video-player');
    videoPlayer.style.left = '400px';

    // change the layout options UI
    option.classList.remove('selected');
    event.currentTarget.classList.add('selected');
    setCurrentLayout(Layouts.SIDEBAR_LEFT);
  }
}

async function setLayoutOptions() {
  for await (let element of getOptions()) {
    let firstChild = element.firstChild;
    if (firstChild.textContent === 'Sidebar') {
      // Renaming the previous option as Sidebar Left
      firstChild.textContent = Layouts.SIDEBAR_LEFT;

      element.addEventListener('click', leftSBLayouthandler);
    }
  }

  // Creating the extra layout option
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
  newOption.addEventListener('click', rightSBLayoutHandler);
}

async function setSelectedLayout() {
  let currentLayout = await getCurrentLayout();
  for await (let option of getOptions()) {
    if (option.firstChild.textContent === currentLayout) {
      option.classList.add('selected');
    }
  }
}

async function setUpLayoutObserver(tabState) {
  // This observer checks if the user has opened the options to switch the stats
  // layout which triggers a mutation.
  tabState.observer = new MutationObserver(async (mutationRecords) => {
    for (let element of mutation.recordsIterator(mutationRecords)) {
      if (element.className === 'WatchOptionsLayout') {
        await setLayoutOptions();
        setSelectedLayout();
      }
    }
  });

  let targetElement = getElementBySelector('.Watch.large');
  let config = { childList: true, subtree: true };
  tabState.observer.observe((await targetElement), config);
}