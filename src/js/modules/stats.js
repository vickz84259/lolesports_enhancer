import * as mutation from './mutation.js';
import { getFromStorage } from './utils.js';
import { getElementBySelector } from './DOM_utils';
import { ALLY_TEAMS } from './keys.js'

export { init, disconnect };


class StatsInfo {

  constructor() {
    this.allyTeam = null;
    this.previousTime = 0;

    this.timeLog = [];
  }

  logTime(currentTime) {
    if ((currentTime - this.previousTime) >= 1.5) {
      this.timeLog.push(currentTime);
      if (this.timeLog.length == 5) this.timeLog.shift();

      this.previousTime = currentTime;
    }
  }

  canAnnounce() {
    let lastThree = this.timeLog.slice(-3);
    let diffOne = lastThree[2] - lastThree[1];
    let diffTwo = lastThree[1] - lastThree[0];

    return (diffOne + diffTwo) > 3.5 ? false : true;
  }
}

const statsInfo = new StatsInfo();

function videoInfoHandler(event) {
  let eventData = JSON.parse(event.data);
  if (eventData.event === 'infoDelivery' && 'currentTime' in eventData.info) {
    statsInfo.logTime(eventData.info.currentTime);
  }
}

async function getTeams() {
  // Get the teams currently playing
  let teams = await getElementBySelector('.match .teams');
  let result = [];
  for (let element of teams.children) {
    if (element.className === 'team') {
      result.push(element.firstChild.textContent);
    }
  }
  return result;
}


function getKDAObserver(playerElement) {
  let observer = new MutationObserver(() => {
    console.log(statsInfo.canAnnounce());
  });

  let kdaElement = playerElement.querySelector('.details .stat.kda .kills');
  let config = { characterData: true, characterDataOldValue: true };
  observer.observe(kdaElement.childNodes[0], config);

  return observer;
}


async function setUpStatsObserver(tabState) {
  // This observer checks if the team stats div has been added
  let observer = new MutationObserver(async (mutationRecords, currentObserver) => {
    for (let element of mutation.recordsIterator(mutationRecords)) {
      if (element.className === 'StatsTeams') {
        currentObserver.disconnect();

        let teamsPlayers = await getElementBySelector('.StatsTeamsPlayers');
        for (let statsTeam of teamsPlayers.children) {

          let className = statsTeam.className;
          if (className === 'blue-team' || className === 'red-team') {

            for (let player of statsTeam.children) {
              tabState.addObserver(getKDAObserver(player));
            }
          }
        }
        break;
      }
    }
  });

  let targetElement = getElementBySelector('.overview-pane');
  observer.observe((await targetElement), { childList: true });

  tabState.addObserver(observer);
}

async function init(tabState) {
  let allyTeams = await getFromStorage(ALLY_TEAMS);
  if (allyTeams !== 'None') {
    let teams = await getTeams();
    for (let team of teams) {
      if (allyTeams.includes(team)) {
        allyTeam = team;
        break;
      }
    }
  }

  setUpStatsObserver(tabState);

  window.addEventListener('message', videoInfoHandler);
}

function disconnect() {
  window.removeEventListener('message', videoInfoHandler);
  statsInfo = null;
}