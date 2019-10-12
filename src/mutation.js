export function* filteredNodes(nodes) {
  // Generator to filter and yield only nodes of type Element.
  for (let node of nodes) {
    if (node.nodeType === 1) {
      yield node;
    }
  }
}

export function* recordsIterator(mutationRecords) {
  for (let mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.addedNodes);
  }
}