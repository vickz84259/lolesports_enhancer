import * as announcer from '../announcer.js';
import { getFromStorage, setToStorage } from '../utils.js';
import { getElementBySelector } from '../DOM_utils';
import { ALLY_TEAMS } from '../keys.js';


class BaseStats {

  constructor() {
    this.audioContext = new AudioContext();
    this.audioFiles = new Map();
    this.audioBuffers = new Map();

    this.loadAudioFiles();
    this.loadScenarios();

    this.reset();
  }

  get allyTeam() {
    return this._allyTeam;
  }

  set allyTeam(team) {
    this._allyTeam = team;

    if (team) {
      let index = this.allyTeams.indexOf(team);

      if (index >= 0) {
        let temp = this.allyTeams[0];
        this.allyTeams[0] = team;
        this.allyTeams[index] = temp;
      } else {
        this.allyTeams.unshift(team);
      }

      setToStorage(ALLY_TEAMS, this.allyTeams);
    }
  }

  async loadAudioFiles() {
    // Download any missing files first.
    await announcer.checkFiles();

    for await (let audioObj of announcer.getAudioFiles()) {
      this.audioFiles.set(audioObj.fileName, audioObj.data);
    }
  }

  async loadScenarios() {
    this.scenarios = await announcer.getScenarios();
  }

  async playAudio(scenarioType) {
    let source = this.audioContext.createBufferSource();

    let scenarios = this.scenarios[scenarioType];
    let fileName = scenarios[Math.floor(Math.random() * scenarios.length)];

    let audioBuffer = null;
    if (this.audioBuffers.has(fileName)) {
      audioBuffer = this.audioBuffers.get(fileName);
    } else {
      let audioFile = this.audioFiles.get(fileName);
      audioBuffer = await this.audioContext.decodeAudioData(audioFile);
    }

    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();

    if (!this.audioBuffers.has(fileName)) {
      this.audioFiles.delete(fileName);
      this.audioBuffers.set(fileName, audioBuffer);
    }
  }

  async reset() {
    // setting allyTeam
    this._allyTeam = null;

    this.allyTeams = await getFromStorage(ALLY_TEAMS);
    if (this.allyTeams === 'None') {
      this.allyTeams = [];
      setToStorage(ALLY_TEAMS, this.allyTeams);
    } else {
      for await (let teamName of getTeamNames()) {
        if (this.allyTeams.includes(teamName)) {
          this._allyTeam = teamName;
          break;
        }
      }
    }
  }
}

export class StatsInfo extends BaseStats {

  constructor() {
    super();

    this.previousTime = 0; // Deprecated
    this.isYouTube = false; // Deprecated
    this.timeLog = []; // Deprecated

    this.reset(true);
  }

  /* Deprecated */
  logTime(currentTime) {
    currentTime = Math.floor(currentTime * 10) / 10;
    if ((currentTime - this.previousTime) >= 2.5) {
      this.previousTime = currentTime;

      this.timeLog.push(currentTime);
      if (this.timeLog.length === 6) this.timeLog.shift();
    }
  }

  /* Deprecated */
  canAnnounce() {
    if (this.isYouTube) {
      let lastFour = this.timeLog.slice(-4);
      let diffOne = lastFour[3] - lastFour[2];
      let diffTwo = lastFour[2] - lastFour[1];
      let diffThree = lastFour[1] - lastFour[0];

      return !((diffOne + diffTwo + diffThree) > 7.85);
    }
    return true;
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

  reset(init = false) {
    if (!init) super.reset();

    this.blueDead = 0;
    this.redDead = 0;
    this.totalKills = 0;

    this.blueAce = false;
    this.redAce = false;
  }
}

export async function* getTeamNames() {
  // Get the teams currently playing
  let teams = await getElementBySelector('.match .teams');
  for (let element of teams.children) {
    if (element.className === 'team') {
      yield element.firstChild.textContent;
    }
  }
}
