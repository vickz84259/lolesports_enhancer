import * as mutation from './mutation.js';
import { getFromStorage, setToStorage } from './utils.js';
import { getElementBySelector } from './DOM_utils';
import { ALLY_TEAMS, ANNOUNCER } from './keys.js';
import { StatsInfo } from './stats/statsInfo.js';

export { init, disconnect };


let statsInfo;

function videoInfoHandler(event) {
  let eventData = JSON.parse(event.data);
  if (eventData.event === 'infoDelivery' && 'currentTime' in eventData.info) {
    if (!statsInfo.isYouTube) statsInfo.isYouTube = true;
    statsInfo.logTime(eventData.info.currentTime);
  }
}


function getKDAObserver(playerElement) {
  let consecutiveKills = 0;
  let team = (playerElement.parentElement.className === 'blue-team') ? 'blue' : 'red';
  let enemyTeam = (team === 'blue') ? 'red' : 'blue';

  let playerName = playerElement.firstElementChild.textContent;
  let lastKill = 0;

  let multiKill = 0;
  let totalKills = 0;

  let observer = new MutationObserver((mutationRecords) => {
    let type = mutationRecords[0].target.parentElement.className;
    if (type === 'deaths') {
      consecutiveKills = 0;
    } else {
      if (statsInfo.canAnnounce()) {
        let condition = (statsInfo.allyTeam && playerName.includes(statsInfo.allyTeam));
        let isAlly = (condition) ? true : false;

        let currentTime = Date.now();
        let timeDiff = (currentTime - lastKill) / 1000;
        lastKill = currentTime;

        let newValue = Number(mutationRecords[0].target.nodeValue);
        let oldValue = Number(mutationRecords[0].oldValue);
        let kills = newValue - oldValue;

        if (kills >= 1) {
          if (totalKills === 0) {
            multiKill = kills;
          } else {
            if (timeDiff <= 11.3) {
              multiKill += kills;
            } else {
              multiKill = kills;
            }
          }
          totalKills = newValue;
          consecutiveKills += kills;

          let scenarioType = '';
          switch (multiKill) {
            case 1:
              switch (consecutiveKills) {
                case 3:
                  scenarioType = 'spree';
                  break;
                case 4:
                  scenarioType = 'rampage';
                  break;
                case 5:
                  scenarioType = 'unstoppable';
                  break;
                case 6:
                  scenarioType = 'dominating';
                  break;
                case 7:
                  scenarioType = 'godlike';
                  break;
                default:
                  if (consecutiveKills >= 8) {
                    scenarioType = 'legendary';
                  } else {
                    scenarioType = 'ally';
                  }
                  break;
              }
              break;
            case 2:
              scenarioType = 'double';
              break;
            case 3:
              scenarioType = 'triple';
              break;
            case 4:
              scenarioType = 'quadra';
              break;
            case 5:
              let enemyAce = (enemyTeam === 'blue') ? statsInfo.blueAce : statsInfo.redAce;
              if (timeDiff <= 30.0 && enemyAce) {
                scenarioType = 'penta';
              }
              break;
          }
          if (statsInfo.totalKills === 0) {
            scenarioType = 'first_blood';
          }

          if (statsInfo.allyTeam) {
            if (isAlly) {
              if (scenarioType === 'ally') {
                scenarioType = 'enemy';
              } else {
                scenarioType = `ally_${scenarioType}`;
              }
            } else {
              if (scenarioType !== 'ally') {
                scenarioType = `enemy_${scenarioType}`;
              }
            }
          }

          statsInfo.playAudio(scenarioType);
        }
        statsInfo.totalKills += kills;
      }

    }
  });

  let config = { characterData: true, characterDataOldValue: true };
  let killsElement = playerElement.querySelector('.details .stat.kda .kills');
  observer.observe(killsElement.childNodes[0], config);

  let deathsElement = playerElement.querySelector('.details .stat.kda .deaths');
  observer.observe(deathsElement.childNodes[0], config);

  return observer;
}

function getDeathObserver(playerElement) {
  let isDead = false;
  let team = (playerElement.parentElement.className === 'blue-team') ? 'blue' : 'red';

  let observer = new MutationObserver((mutationRecords) => {
    let target = mutationRecords[0].target;
    if (target.classList.contains('dead') && !isDead) {
      isDead = true;
      statsInfo.updateDeaths(team, isDead);
    } else if (!target.classList.contains('dead') && isDead) {
      isDead = false;
      statsInfo.updateDeaths(team, isDead);
    }
  });

  let config = { attributeFilter: ['class'], attributeOldValue: true };
  observer.observe(playerElement, config);

  return observer;
}


async function setUpStatsObserver(tabState) {
  // This observer checks if the team stats div has been added
  let observers = [];
  let hasAddedObservers = false;

  let addedObserver = new MutationObserver((mutationRecords) => {
    for (let element of mutation.addedRecordsIterator(mutationRecords)) {
      if (element.className === 'StatsTeamsPlayers') {
        if (hasAddedObservers) break;
        hasAddedObservers = true;

        for (let statsTeam of element.children) {

          let className = statsTeam.className;
          if (className === 'blue-team' || className === 'red-team') {

            for (let player of statsTeam.children) {
              let kdaObserver = getKDAObserver(player);
              let deathObserver = getDeathObserver(player);

              observers.push(kdaObserver, deathObserver);

              tabState.addObserver(kdaObserver);
              tabState.addObserver(deathObserver);
            }
          }
        }
      }
    }
  });

  let removedObserver = new MutationObserver((mutationRecords) => {
    for (let element of mutation.removedRecordsIterator(mutationRecords)) {
      if (element.className === 'StatsTeamsPlayers') {
        hasAddedObservers = false;

        for (let observer of observers) {
          observer.disconnect();
        }
        observers = [];

        statsInfo.reset();
      }
    }
  });

  let config = { childList: true, subtree: true };
  addedObserver.observe(document.body, config);
  removedObserver.observe(document.body, config);

  tabState.addObserver(addedObserver);
  tabState.addObserver(removedObserver);
}

async function init(tabState) {
  let announcerState = await getFromStorage(ANNOUNCER);
  if (announcerState) {
    statsInfo = new StatsInfo();
    setUpStatsObserver(tabState);

    window.addEventListener('message', videoInfoHandler);
  }

  let teamsElement = await getElementBySelector('.EventMatchScore .match .teams');
  for (let element of teamsElement.children) {
    if (element.className === 'team') {
      element.firstElementChild.addEventListener('click', async (event) => {
        let team = event.target.textContent;
        statsInfo.allyTeam = team;

        let allyTeams = await getFromStorage(ALLY_TEAMS);
        let index = allyTeams.indexOf(team);
        if (index != -1) {
          let temp = allyTeams[0];
          allyTeams[0] = team;
          allyTeams[index] = temp;
        } else {
          allyTeams.unshift(team);
        }

        setToStorage(ALLY_TEAMS, allyTeams);
      });
    }
  }
}

function disconnect() {
  window.removeEventListener('message', videoInfoHandler);
  statsInfo = null;
}