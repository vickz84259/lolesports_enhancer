/**
 * Filters out non Element DOM nodes and those without the specified class name
 *
 * @yields Element that contains the specified class name
 */
export function* filteredNodes(nodes: NodeList, className: string) {
  for (const node of nodes) {
    if ((node as Node).nodeType === 1 &&
        (node as HTMLElement).classList.contains(className)) {
      yield (node as HTMLElement);
    }
  }
}


/**
 * Iterates over the specified mutationRecords and retrieves the nodes of type
 * Element that have been added and whose className matches the one specified.
 *
 * @yields Element that contains the specified class name
 */
export function* addedRecordsIterator(
    mutationRecords: MutationRecord[],
    className: string
) {
  for (const mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.addedNodes, className);
  }
}


/**
 * Iterates over the specified mutationRecords and retrieves the nodes of type
 * Element that have been removed and whose className matches the one specified.
 *
 * @yields Element that contains the specified class name
 */
export function* removedRecordsIterator(
    mutationRecords: MutationRecord[],
    className: string
) {
  for (const mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.removedNodes, className);
  }
}
