import * as mutation from './mutation.js';
import * as announcer from './announcer.js';
import { getFromStorage } from './utils.js';
import { getElementBySelector } from './DOM_utils';
import { ALLY_TEAMS, ANNOUNCER } from './keys.js';

export { init, disconnect };


class StatsInfo {

  constructor() {
    this.allyTeam = null;
    this.previousTime = 0;

    this.announcerState = false;
    this.timeLog = [];

    this.audioFiles = new Map();

    this.blueDead = 0;
    this.redDead = 0;
    this.totalKills = 0;

    this.blueAce = false;
    this.redAce = false;
  }

  logTime(currentTime) {
    currentTime = Math.floor(currentTime * 10) / 10;
    if ((currentTime - this.previousTime) >= 2.5) {
      this.previousTime = currentTime;

      this.timeLog.push(currentTime);
      if (this.timeLog.length == 6) this.timeLog.shift();
    }
  }

  canAnnounce() {
    let lastFour = this.timeLog.slice(-4);
    let diffOne = lastFour[3] - lastFour[2];
    let diffTwo = lastFour[2] - lastFour[1];
    let diffThree = lastFour[1] - lastFour[0];

    return (diffOne + diffTwo + diffThree) > 7.85 ? false : true;
  }

  async loadAudioFiles() {
    this.audioContext = new AudioContext();
    for await (let audioObj of announcer.getAudioFiles()) {
      let audioBuffer = await this.audioContext.decodeAudioData(audioObj.data);
      this.audioFiles.set(audioObj.fileName, audioBuffer);
    }
  }

  playAudio(scenarioType) {
    let source = this.audioContext.createBufferSource();

    let scenario = statsInfo.scenarios[scenarioType];
    let fileName = scenario[Math.floor(Math.random() * scenario.length)];
    source.buffer = this.audioFiles.get(fileName);
    source.connect(this.audioContext.destination);
    source.start();
  }

  updateDeaths(team, dead) {
    if (dead) {
      if (team === 'blue') {
        this.blueDead += 1;
      } else {
        this.redDead += 1;
      }
    } else {
      if (team === 'blue') {
        this.blueDead -= 1;
        if (this.blueAce) this.blueAce = false;
      } else {
        this.redDead -= 1;
        if (this.redAce) this.redAce = false;
      }
    }

    if (this.blueDead === 5 && !this.blueAce) {
      this.blueAce = true;
      this.playAudio('ace');
    } else if (this.redDead === 5 && !this.redAce) {
      this.redAce = true;
      this.playAudio('ace');
    }
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
  let consecutiveKills = 0;
  let team = (playerElement.parentElement.className === 'blue-team') ? 'blue' : 'red';
  let enemyTeam = (team === 'blue') ? 'red' : 'blue';

  let lastKill = 0;

  let multiKill = 0;
  let totalKills = 0;

  let observer = new MutationObserver((mutationRecords) => {
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
              tabState.addObserver(getDeathObserver(player));
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

  statsInfo.announcerState = await getFromStorage(ANNOUNCER);
  if (statsInfo.announcerState) {
    await announcer.downloadMissingFiles();

    statsInfo.scenarios = await announcer.getScenarios();
    statsInfo.loadAudioFiles();
  }

  setUpStatsObserver(tabState);

  window.addEventListener('message', videoInfoHandler);
}

function disconnect() {
  window.removeEventListener('message', videoInfoHandler);
  statsInfo = null;
}