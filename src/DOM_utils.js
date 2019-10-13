export { getElementBySelector, getElementById };

async function getElement(id = null, selector = null) {
  /* Retrieves the DOM element based on either it's id or selector
  The function will repeatedly try getting said element after a slight delay
  between each call */
  while (true) {
    let result = (id) ? document.getElementById(id) : document.querySelector(selector);
    if (result) break;

    await delay();
  }
  return result;
}

function getElementById(id) {
  // Returns a promise
  return getElement(id);
}

function getElementBySelector(selector) {
  // Returns a promise
  return getElement(null, selector);
}

function delay(timeout = 1000) {
  let promise = new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  })

  return promise;
}