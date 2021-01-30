export { getElementBySelector, getElementById };

/**
 * Retrieves the DOM element based on either its id or selector. The function
 * will repeatedly try getting said element after a slight delay between each
 * call
 */
async function getElement(id?: string, selector?: string) {
  while (true) {
    const result = (id) ?
      document.getElementById(id) : document.querySelector(selector as string);
    if (result) return result as HTMLElement;

    // eslint-disable-next-line no-await-in-loop
    await delay();
  }
}


function getElementById(id: string) {
  return getElement(id);
}


function getElementBySelector(selector: string) {
  // eslint-disable-next-line no-undefined
  return getElement(undefined, selector);
}


function delay(timeout = 1000) {
  const promise = new Promise<void>(resolve => {
    setTimeout(() => resolve(), timeout);
  });

  return promise;
}
