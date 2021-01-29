import { getElementBySelector } from '../DOM/utils';
import { getSVG } from '../utils/resources';
import { getTeamNames, StatsInfo } from './statsInfo';
import type { TabState } from '../link_state';


/**
 * @param type - the type of HTML Element to be created
 * @param className - the value of the class attribute for the element
 *
 * @returns the created element
 */
function createElement(type: string, className: string) {
  const element = document.createElement(type);
  element.setAttribute('class', className);

  return element;
}


/**
 * Creates a HTML element of type "div" with the given class name and content
 *
 * @param className - the value of the class attribute for the div
 * @param [content] - the value of the textContent
 *
 * @returns the created div
*/
function createContentDiv(className: string, content?: string) {
  const div = createElement('div', className);
  div.textContent = (content) ? content : 'None';

  return div;
}


function createOption(statsInfo: StatsInfo, optionName: string) {
  const label = createElement('span', 'label');
  label.textContent = optionName;

  const allyTeam = statsInfo.allyTeam;
  const selected = (optionName === 'None') ?
    !allyTeam : allyTeam === optionName;

  const optionClassName = (selected) ? 'option selected' : 'option';
  const option = createElement('li', optionClassName);
  option.appendChild(label);

  option.addEventListener('click', () => {
    statsInfo.allyTeam = (optionName === 'None') ? '' : optionName;

    const label = document.querySelector('.ally-section .label')!;
    label.textContent = optionName;

    resetOptions();
  });

  return option;
}


function resetOptions() {
  const allyOptions = document.querySelector('.options-section.ally-selection');
  if (allyOptions) {
    allyOptions.remove();

    const parent = document.querySelector('.watch-options .main-menu')!;
    for (let index = parent.children.length - 1; index >= 0; --index) {
      parent.children[index].removeAttribute('hidden');
    }
  }
}


function getAllySectionHandler(statsInfo: StatsInfo) {
  return async function handler() {
    const watchOptions = document.querySelector('.WatchOptions')!;
    watchOptions.classList.add('active');

    const parent = document.querySelector('.watch-options .main-menu')!;
    for (let index = parent.children.length - 1; index >= 0; --index) {
      parent.children[index].setAttribute('hidden', '');
    }

    const allySection = createElement('div', 'options-section ally-selection');
    allySection.appendChild(createContentDiv('title', 'SELECT AN ALLY TEAM'));
    parent.appendChild(allySection);

    const optionsList = createElement('ul', 'options-list');
    allySection.appendChild(optionsList);

    for await (const team of getTeamNames()) {
      optionsList.appendChild(createOption(statsInfo, team));
    }
    optionsList.appendChild(createOption(statsInfo, 'None'));
  };
}


async function addAllySection(statsInfo: StatsInfo) {
  if (!document.querySelector('.ally-section')) {
    const optionDiv = createElement('div', 'option');
    optionDiv.appendChild(createContentDiv('label', statsInfo.allyTeam));
    optionDiv.addEventListener('click', getAllySectionHandler(statsInfo));

    const rightCaret = await getSVG('img/right_caret.svg');
    // @ts-ignore
    optionDiv.insertAdjacentHTML('beforeend', DOMPurify.sanitize(rightCaret));

    const optionsList = createElement('div', 'options-list');
    optionsList.appendChild(optionDiv);

    const titleDiv = createContentDiv('title', 'ALLY TEAM (EXTENSION)');

    const optionsSection = createElement('div', 'options-section ally-section');
    optionsSection.append(titleDiv, optionsList);

    const menu = await getElementBySelector('.watch-options .main-menu');
    menu.appendChild(optionsSection);
  }
}

async function getOptionsObserver() {
  const observer = new MutationObserver(records => {

    const target = records[0].target as Element;
    if (!target.classList.contains('active')) {
      resetOptions();
    }
  });

  const watchOptions = await getElementBySelector('.WatchOptions');
  observer.observe(watchOptions, { attributeFilter: ['class'] });
  return observer;
}


export async function init(tabState: TabState, statsInfo: StatsInfo) {
  const optionsBtn = await getElementBySelector('.options-button');
  optionsBtn.addEventListener('click', () => addAllySection(statsInfo));

  tabState.addObserver(await getOptionsObserver());
}
