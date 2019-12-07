/**
 * Fetches a web accessible resource found at the given path
 *
 * @param {string} path - relative path to the resource file
 *
 * @returns {Promise<Response>}
 */
function getResource(path) {
  return fetch(browser.runtime.getURL(path));
}


/**
 * Fetches a SVG resource file found at the given path
 *
 * @param {string} path - relative path to the SVG file
 *
 * @returns {Promise<string>} data contained in the SVG file
 */
export async function getSVG(path) {
  return (await getResource(path)).text();
}


/**
 * @typedef {Object} announcerJson
 * @property {string[]} language - array containing the various locales for the
 *    specified announcer
 * @property {Object<string, number[]>} categories - specifies the various
 *    announcer scenarios and the file numbers associated with a particular
 *    scenario
 */

/**
 * Fetches json data from a web accessible resource
 *
 * @param {string} path - relative path to the json file
 *
 * @returns {Promise<announcerJson>}
 */
export async function getJson(path) {
  // All the json resource files are announcer scenario files
  return (await getResource(path)).json();
}
