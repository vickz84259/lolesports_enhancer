import * as mutation from './mutation.js';
import * as options from './stats/options.js';
import { getFromStorage } from './utils.js';
import { ANNOUNCER } from './keys.js';
import { StatsInfo } from './stats/statsInfo.js';

export { init, disconnect };


let statsInfo = null;

function videoInfoHandler(event) {
  let eventData = JSON.parse(event.data);
  if (eventData.event === 'infoDelivery' && 'currentTime' in eventData.info) {
    if (!statsInfo.isYouTube) statsInfo.isYouTube = true;
    statsInfo.logTime(eventData.info.currentTime);
  }
}


function getKDAObserver(playerElement) {
  let consecutiveKills = 0;
  let team = (playerElement.parentElement.className === 'blue-team') ?
    'blue' : 'red';
  let enemyTeam = (team === 'blue') ? 'red' : 'blue';

  let playerName = playerElement.firstElementChild.textContent;
  let lastKill = 0;

  let multiKill = 0;
  let totalKills = 0;

  let observer = new MutationObserver(mutationRecords => {
    let type = mutationRecords[0].target.parentElement.className;
    if (type === 'deaths') {
      consecutiveKills = 0;
    } else {
      if (statsInfo.canAnnounce()) {
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

          let enemyAce = (enemyTeam === 'blue') ?
            statsInfo.blueAce : statsInfo.redAce;

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
              if (timeDiff <= 30.0 && enemyAce) {
                scenarioType = 'penta';
              }
              break;
            default:
              console.log('unknown scenario');
              break;
          }
          if (statsInfo.totalKills === 0) {
            scenarioType = 'first_blood';
          }

          if (statsInfo.allyTeam) {
            if (playerName.includes(statsInfo.allyTeam)) {
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
  let team = (playerElement.parentElement.className === 'blue-team') ?
    'blue' : 'red';

  let observer = new MutationObserver(mutationRecords => {
    let target = mutationRecords[0].target;
    if (target.classList.contains('dead') && !isDead) {
      isDead = true;
      statsInfo.updateDeaths(team, isDead);
    } else if (!target.classList.contains('dead') && isDead) {
      isDead = false;
      statsInfo.updateDeaths(team, isDead);
    }
  });

  observer.observe(playerElement, { attributeFilter: ['class'] });
  return observer;
}


function setUpStatsObserver(tabState) {
  // This observer checks if the team stats div has been added
  let observers = [];
  let hasAddedObservers = false;

  let addedObserver = new MutationObserver(records => {
    let elements = mutation.addedRecordsIterator(records, 'StatsTeamsPlayers');
    for (let element of elements) {
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
  });

  let removedObserver = new MutationObserver(records => {
    let removed = mutation.removedRecordsIterator(records, 'StatsTeamsPlayers');
    for (let _ of removed) {
      hasAddedObservers = false;

      for (let observer of observers) {
        observer.disconnect();
      }
      observers = [];

      statsInfo.reset();
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

    options.init(tabState, statsInfo);

    window.addEventListener('message', videoInfoHandler);
  }
}

function disconnect() {
  window.removeEventListener('message', videoInfoHandler);
  statsInfo = null;
}
