import * as mutation from '../DOM/mutation.js';
import * as options from '../stats/options.js';
import * as storage from '../storage/simple.js';
import { ANNOUNCER } from '../storage/keys.js';
import { StatsInfo } from '../stats/statsInfo.js';

export { init, disconnect };


/** @typedef {import('../link_state.js').TabStateDef} TabState */

/** @type {?StatsInfo} */
let statsInfo = null;


/** @param {*} event */
function videoInfoHandler(event) {
  const eventData = JSON.parse(event.data);
  if (eventData.event === 'infoDelivery' && 'currentTime' in eventData.info) {
    if (!statsInfo.isYouTube) statsInfo.isYouTube = true;
    statsInfo.logTime(eventData.info.currentTime);
  }
}


/**
 * @param {Element} playerElement
 *
 * @returns {MutationObserver}
 */
function getKDAObserver(playerElement) {
  const team = (playerElement.parentElement.className === 'blue-team') ?
    'blue' : 'red';
  const enemyTeam = (team === 'blue') ? 'red' : 'blue';

  const playerName = playerElement.firstElementChild.textContent;

  /** @type {number} */
  let consecutiveKills = 0;
  /** @type {number} */
  let lastKill = 0;
  /** @type {number} */
  let multiKill = 0;
  /** @type {number} */
  let totalKills = 0;

  const observer = new MutationObserver(mutationRecords => {
    const type = mutationRecords[0].target.parentElement.className;
    if (type === 'deaths') {
      consecutiveKills = 0;
    } else {
      if (statsInfo.canAnnounce()) {
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastKill) / 1000;
        lastKill = currentTime;

        const newValue = Number(mutationRecords[0].target.nodeValue);
        const oldValue = Number(mutationRecords[0].oldValue);
        const kills = newValue - oldValue;

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

          const enemyAce = (enemyTeam === 'blue') ?
            statsInfo.blueAce : statsInfo.redAce;

          /** @type {string} */
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

  const config = { characterData: true, characterDataOldValue: true };
  const killsElement = playerElement.querySelector('.details .stat.kda .kills');
  observer.observe(killsElement.childNodes[0], config);

  const deathsElement = playerElement.
    querySelector('.details .stat.kda .deaths');
  observer.observe(deathsElement.childNodes[0], config);

  return observer;
}


/**
 * @param {Element} playerElement
 *
 * @returns {MutationObserver}
 */
function getDeathObserver(playerElement) {
  /** @type {boolean} */
  let isDead = false;
  const team = (playerElement.parentElement.className === 'blue-team') ?
    'blue' : 'red';

  const observer = new MutationObserver(mutationRecords => {
    /** @type {Element} */
    const target = (mutationRecords[0].target);
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


/**
 * The stats observer checks whether the team stats div has been added
 *
 * @param {TabState} tabState
 */
function setUpStatsObserver(tabState) {
  /** @type {MutationObserver[]} */
  let observers = [];
  /** @type {boolean} */
  let hasAddedObservers = false;

  const addedObserver = new MutationObserver(records => {
    const elements = mutation.
      addedRecordsIterator(records, 'StatsTeamsPlayers');
    for (const element of elements) {
      if (hasAddedObservers) break;
      hasAddedObservers = true;

      for (const statsTeam of element.children) {

        const className = statsTeam.className;
        if (className === 'blue-team' || className === 'red-team') {

          for (const player of statsTeam.children) {
            const kdaObserver = getKDAObserver(player);
            const deathObserver = getDeathObserver(player);

            observers.push(kdaObserver, deathObserver);

            tabState.addObserver(kdaObserver);
            tabState.addObserver(deathObserver);
          }
        }
      }
    }
  });

  const removedObserver = new MutationObserver(records => {
    const removed = mutation.
      removedRecordsIterator(records, 'StatsTeamsPlayers');
    for (const _ of removed) {
      hasAddedObservers = false;

      for (const observer of observers) {
        observer.disconnect();
      }
      observers = [];

      statsInfo.reset();
    }
  });

  const config = { childList: true, subtree: true };
  addedObserver.observe(document.body, config);
  removedObserver.observe(document.body, config);

  tabState.addObserver(addedObserver);
  tabState.addObserver(removedObserver);
}

/**
 * The initialisation function
 *
 * @param {TabState} tabState
 */
async function init(tabState) {
  const announcerState = await storage.get(ANNOUNCER);
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
