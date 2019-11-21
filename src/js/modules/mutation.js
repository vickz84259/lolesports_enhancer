export function* filteredNodes(nodes, className) {
  // Generator to filter and yield only nodes of type Element and with the
  // specified className.
  for (let node of nodes) {
    if (node.nodeType === 1 && node.classList.contains(className)) {
      yield node;
    }
  }
}

export function* addedRecordsIterator(mutationRecords, className) {
  for (let mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.addedNodes, className);
  }
}

export function* removedRecordsIterator(mutationRecords, className) {
  for (let mutationRecord of mutationRecords) {
    yield* filteredNodes(mutationRecord.removedNodes, className);
  }
}