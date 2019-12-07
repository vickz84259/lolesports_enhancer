import * as announcer from '../announcer.js';
import { getFromStorage, setToStorage } from '../utils.js';
import { getElementBySelector } from '../DOM_utils';
import { ALLY_TEAMS } from '../keys.js';

/**
 * Class to keep track of the in game stats
 * @todo Rename this class and the file in general
 */
class BaseStats {

  constructor() {
    /** @private @const @type {AudioContext}*/
    this.audioContext = new AudioContext();

    /** @private @const @type {Map<string, ArrayBuffer>} */
    this.audioFiles = new Map();

    /** @private @const @type {Map<string, AudioBuffer>} */
    this.audioBuffers = new Map();

    this.loadAudioFiles();
    this.loadScenarios();

    this.reset();
  }

  /** @returns {string} */
  get allyTeam() {
    return this._allyTeam;
  }

  /** @param {string} team */
  set allyTeam(team) {
    this._allyTeam = team;

    if (team) {
      const index = this.allyTeams.indexOf(team);

      if (index >= 0) {
        const temp = this.allyTeams[0];
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

    for await (const audioObj of announcer.getAudioFiles()) {
      this.audioFiles.set(audioObj.fileName, audioObj.data);
    }
  }

  async loadScenarios() {
    /** @type {Object.<string, string[]>} */
    this.scenarios = await announcer.getScenarios();
  }

  /** @param {string} scenarioType */
  async playAudio(scenarioType) {
    const source = this.audioContext.createBufferSource();

    const scenarios = this.scenarios[scenarioType];
    const fileName = scenarios[Math.floor(Math.random() * scenarios.length)];

    /** @type {?AudioBuffer} */
    let audioBuffer = null;
    if (this.audioBuffers.has(fileName)) {
      audioBuffer = this.audioBuffers.get(fileName);
    } else {
      const audioFile = this.audioFiles.get(fileName);
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
    /** @type {?string} */
    this._allyTeam = null;

    const allyTeams = await getFromStorage(ALLY_TEAMS);
    if (allyTeams === 'None') {

      /** @type {string[]} */
      this.allyTeams = [];
      setToStorage(ALLY_TEAMS, this.allyTeams);
    } else {
      this.allyTeams = allyTeams;
      for await (const teamName of getTeamNames()) {
        if (this.allyTeams.includes(teamName)) {
          this._allyTeam = teamName;
          break;
        }
      }
    }
  }
}

/**
 * @extends BaseStats
 */
export class StatsInfo extends BaseStats {

  constructor() {
    super();

    /** @private @deprecated @type {number} */
    this.previousTime = 0;

    /** @private @deprecated @type {boolean} */
    this.isYouTube = false;

    /** @private @deprecated @type {number[]} */
    this.timeLog = [];

    this.reset(true);
  }

  /**
   * @deprecated
   *
   * @param {number} currentTime
   */
  logTime(currentTime) {
    currentTime = Math.floor(currentTime * 10) / 10;
    if ((currentTime - this.previousTime) >= 2.5) {
      this.previousTime = currentTime;

      this.timeLog.push(currentTime);
      if (this.timeLog.length === 6) this.timeLog.shift();
    }
  }

  /**
   * @deprecated
   *
   * @returns {boolean}
   */
  canAnnounce() {
    if (this.isYouTube) {
      const lastFour = this.timeLog.slice(-4);
      const diffOne = lastFour[3] - lastFour[2];
      const diffTwo = lastFour[2] - lastFour[1];
      const diffThree = lastFour[1] - lastFour[0];

      return !((diffOne + diffTwo + diffThree) > 7.85);
    }
    return true;
  }

  /**
   *
   * @param {string} team
   * @param {boolean} dead
   */
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

  /**
   * @param {boolean} [init=false] - Determines whether this function is being
   *    called as part of the initialisation process or not.
   * @override
   *
   * @returns {Promise<void>}
   */
  async reset(init = false) {
    if (!init) await super.reset();

    this.blueDead = 0;
    this.redDead = 0;
    this.totalKills = 0;

    this.blueAce = false;
    this.redAce = false;
  }
}


/**
 * Retrieves the names of the teams currently playing
 *
 * @returns {AsyncGenerator<string, any, unknown>}
 * @yields {string} the name of a team
 */
export async function* getTeamNames() {
  const teams = await getElementBySelector('.match .teams');
  for (const element of teams.children) {
    if (element.className === 'team') {
      yield element.firstChild.textContent;
    }
  }
}
