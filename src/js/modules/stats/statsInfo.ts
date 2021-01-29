import * as announcer from '../announcer';
import * as storage from '../storage/simple';
import { getElementBySelector } from '../DOM/utils';
import { ALLY_TEAMS } from '../storage/keys';


/**
 * Class to keep track of the in game stats
 * @todo Rename this class and the file in general
 */
class BaseStats {
  private readonly audioContext: AudioContext;
  private readonly audioFiles: Map<string, ArrayBuffer>;
  private readonly audioBuffers: Map<string, AudioBuffer>;

  private _allyTeam: string = '';
  private allyTeams: string[] = [];

  private scenarios!: announcer.AnnouncerScenarioFiles;

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

  set allyTeam(team: string) {
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

      storage.set(ALLY_TEAMS, this.allyTeams);
    }
  }

  async loadAudioFiles() {
    // Download any missing files first.
    await announcer.checkFiles();

    for await (const audioObj of announcer.getAudioFiles()) {
      this.audioFiles.set(audioObj.fileName, audioObj.data!);
    }
  }

  async loadScenarios() {
    this.scenarios = await announcer.getScenarios();
  }

  async playAudio(scenarioType: string) {
    const source = this.audioContext.createBufferSource();

    const scenarios = this.scenarios[scenarioType];
    const fileName = scenarios[Math.floor(Math.random() * scenarios.length)];

    let audioBuffer: AudioBuffer | null = null;
    if (this.audioBuffers.has(fileName)) {
      audioBuffer = this.audioBuffers.get(fileName)!;
    } else {
      const audioFile = this.audioFiles.get(fileName)!;
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
    const allyTeams = await storage.get(ALLY_TEAMS);
    if (allyTeams === 'None') {
      this.allyTeams = [];
      storage.set(ALLY_TEAMS, this.allyTeams);

    } else {
      this.allyTeams = allyTeams as string[];
      for await (const teamName of getTeamNames()) {
        if (this.allyTeams.includes(teamName)) {
          this._allyTeam = teamName;
          break;
        }
      }
    }
  }
}


export class StatsInfo extends BaseStats {
  private previousTime: number; // Deprecated
  private timeLog: number[]; // Deprecated
  isYouTube: boolean; // Deprecated

  private blueDead!: number;
  private redDead!: number;
  totalKills!: number;

  blueAce!: boolean;
  redAce!: boolean;

  constructor() {
    super();

    this.previousTime = 0;
    this.isYouTube = false;
    this.timeLog = [];

    this.reset(true);
  }

  /**
   * @deprecated
   */
  logTime(currentTime: number) {
    currentTime = Math.floor(currentTime * 10) / 10;
    if ((currentTime - this.previousTime) >= 2.5) {
      this.previousTime = currentTime;

      this.timeLog.push(currentTime);
      if (this.timeLog.length === 6) this.timeLog.shift();
    }
  }

  /**
   * @deprecated
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

  updateDeaths(team: string, dead: boolean) {
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
   * @param [init=false] - Determines whether this function is being
   *    called as part of the initialisation process or not.
   * @override
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
 * @yields the name of a team
 */
export async function* getTeamNames() {
  const teams = await getElementBySelector('.match .teams');
  for (const element of teams.children) {
    if (element.className === 'team') {
      yield element.firstChild!.textContent!;
    }
  }
}
