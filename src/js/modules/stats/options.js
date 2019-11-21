import { getElementBySelector } from '../DOM_utils.js';
import { getSVG } from '../resources.js';
import { getTeamNames } from './statsInfo.js';


function createElement(type, className) {
  let element = document.createElement(type);
  element.setAttribute('class', className);

  return element;
}


function createContentDiv(className, content) {
  let div = createElement('div', className);
  div.textContent = (content) ? content : 'None';

  return div;
}


function createOption(statsInfo, optionName) {
  let label = createElement('span', 'label');
  label.textContent = optionName;

  let allyTeam = statsInfo.allyTeam;
  let selected = (optionName === 'None') ? !allyTeam : allyTeam === optionName;

  let optionClassName = (selected) ? 'option selected' : 'option';
  let option = createElement('li', optionClassName);
  option.appendChild(label);

  option.addEventListener('click', () => {
    statsInfo.allyTeam = (optionName === 'None') ? null : optionName;

    let label = document.querySelector('.ally-section .label');
    label.textContent = optionName;

    resetOptions();
  });

  return option;
}


function resetOptions() {
  let allyOptions = document.querySelector('.options-section.ally-selection');
  if (allyOptions) {
    allyOptions.remove();

    let parent = document.querySelector('.watch-options .main-menu');
    for (let index = parent.children.length - 1; index >= 0; --index) {
      parent.children[index].removeAttribute('hidden');
    }
  }
}


function getAllySectionHandler(statsInfo) {
  return async function() {
    let watchOptions = document.querySelector('.WatchOptions');
    watchOptions.classList.add('active');

    let parent = document.querySelector('.watch-options .main-menu');
    for (let index = parent.children.length - 1; index >= 0; --index) {
      parent.children[index].setAttribute('hidden', '');
    }

    let optionsSection = createElement('div', 'options-section ally-selection');
    optionsSection.appendChild(createContentDiv('title', 'SELECT AN ALLY TEAM'));
    parent.appendChild(optionsSection);

    let optionsList = createElement('ul', 'options-list');
    optionsSection.appendChild(optionsList);

    for await (let team of getTeamNames()) {
      optionsList.appendChild(createOption(statsInfo, team));
    }
    optionsList.appendChild(createOption(statsInfo, 'None'));
  }
}


async function addAllySection(statsInfo) {
  if (!document.querySelector('.ally-section')) {
    let optionDiv = createElement('div', 'option');
    optionDiv.appendChild(createContentDiv('label', statsInfo.allyTeam));
    optionDiv.addEventListener('click', getAllySectionHandler(statsInfo));

    let rightCaret = await getSVG('img/right_caret.svg');
    optionDiv.insertAdjacentHTML('beforeend', DOMPurify.sanitize(rightCaret));

    let optionsList = createElement('div', 'options-list');
    optionsList.appendChild(optionDiv);

    let titleDiv = createContentDiv('title', 'ALLY TEAM (EXTENSION)');

    let optionsSection = createElement('div', 'options-section ally-section');
    optionsSection.append(titleDiv, optionsList);

    let menu = await getElementBySelector('.watch-options .main-menu');
    menu.appendChild(optionsSection);
  }
}

async function getOptionsObserver() {
  let observer = new MutationObserver((records) => {
    if (!records[0].target.classList.contains('active')) {
      resetOptions();
    }
  });

  let watchOptions = await getElementBySelector('.WatchOptions');
  observer.observe(watchOptions, { attributeFilter: ['class'] });
  return observer;
}

export async function init(tabState, statsInfo) {
  let optionsBtn = await getElementBySelector('.options-button');
  optionsBtn.addEventListener('click', () => addAllySection(statsInfo));

  tabState.addObserver(await getOptionsObserver());
}