/**
 * Fetches a web accessible resource found at the given path
 *
 * @param path - relative path to the resource file
 */
function getResource(path: string): Promise<Response> {
  return fetch(browser.runtime.getURL(path));
}


/**
 * Fetches a SVG resource file found at the given path
 *
 * @param path - relative path to the SVG file
 *
 * @returns data contained in the SVG file
 */
export async function getSVG(path: string): Promise<string> {
  return (await getResource(path)).text();
}

/**
 * specifies the various announcer scenarios and the file numbers associated
 * with a particular scenario
 */
interface AnnouncerScenarios {
  [key: string]: number[]
}

interface AnnouncerJson {
  // array containing the various locales for the specified announcer
  languages: string[]
  categories: AnnouncerScenarios
}

/**
 * Fetches json data from a web accessible resource
 *
 * @param path - relative path to the json file
 */
export async function getJson(path: string): Promise<AnnouncerJson> {
  // All the json resource files are announcer scenario files
  return (await getResource(path)).json();
}
