/**
 * Filters out non Element DOM nodes and those without the specified class name
 *
 * @param {NodeList} nodes
 * @param {string} className
 *
 * @returns {Generator<HTMLElement, void, unknown>}
 * @yields {HTMLElement} - Element that contains the specified class name
 */
export function* filteredNodes(nodes, className) {
  for (const node of nodes) {
    if (node.nodeType === 1 &&
    /** @type {HTMLElement} */ (node).classList.contains(className)) {
      yield /** @type {HTMLElement} */ (node);
    }
  }
}


/**
 * Iterates over the specified mutationRecords and retrieves the nodes of type
 * Element that have been added and whose className matches the one specified.
 *
 * @param {MutationRecord[]} mutationRecords
 * @param {string} className
 *
 * @returns {Generator<HTMLElement, void, unknown>}
 * @yields {HTMLElement} - Element that contains the specified class name
 */
export function* addedRecordsIterator(mutationRecords, className) {
  for (const mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.addedNodes, className);
  }
}


/**
 * Iterates over the specified mutationRecords and retrieves the nodes of type
 * Element that have been removed and whose className matches the one specified.
 *
 * @param {MutationRecord[]} mutationRecords
 * @param {string} className
 *
 * @returns {Generator<HTMLElement, void, unknown>}
 * @yields {HTMLElement} - Element that contains the specified class name
 */
export function* removedRecordsIterator(mutationRecords, className) {
  for (const mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.removedNodes, className);
  }
}
