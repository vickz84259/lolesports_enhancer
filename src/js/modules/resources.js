function getResource(path) {
  return fetch(browser.runtime.getURL(path));
}

export async function getSVG(path) {
  return (await getResource(path)).text();
}

export async function getJson(path) {
  /* Fetches json data from a web accessible resource

  Args:
    path: Relative path to the resource file

  Returns:
    An object representing the json data retrieved
  */
  return (await getResource(path)).json();
}
