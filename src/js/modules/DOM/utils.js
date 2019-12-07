export { getElementBySelector, getElementById };

/**
 * Retrieves the DOM element based on either its id or selector. The function
 * will repeatedly try getting said element after a slight delay between each
 * call
 *
 * @param {?string} id
 * @param {?string} [selector=null]
 *
 * @returns {Promise<HTMLElement>}
 */
async function getElement(id = null, selector = null) {
  while (true) {
    /** @type {HTMLElement} */
    const result = (id) ?
      document.getElementById(id) : document.querySelector(selector);
    if (result) return result;

    // eslint-disable-next-line no-await-in-loop
    await delay();
  }
}

/**
 * @param {string} id
 *
 * @returns {PromiseLike<HTMLElement>}
 */
function getElementById(id) {
  return getElement(id);
}

/**
 * @param {string} selector
 *
 * @returns {PromiseLike<HTMLElement>}
 */
function getElementBySelector(selector) {
  // Returns a promise
  return getElement(null, selector);
}

/**
 * @param {number} [timeout]
 *
 * @returns {Promise}
 */
function delay(timeout = 1000) {
  const promise = new Promise(resolve => {
    setTimeout(() => resolve(), timeout);
  });

  return promise;
}
