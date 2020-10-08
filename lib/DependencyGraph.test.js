'use strict'
const test = require('ava')
const path = require('path')
const createDependencyGraph = require('./DependencyGraph.js')

function resolveArray(arr) {
  return arr.map((p) => path.resolve(p))
}

test('tracks dependencies', (t) => {
  const graph = createDependencyGraph()
  graph.add({ file: 'aa', parent: 'a' })
  graph.add({ file: 'bb', parent: 'b' })
  graph.add({ file: 'ab', parent: 'a' })
  graph.add({ file: 'ab', parent: 'b' })
  t.deepEqual(graph.dependantsOf('aa'), resolveArray(['a']))
  t.deepEqual(graph.dependantsOf('bb'), resolveArray(['b']))
  t.deepEqual(graph.dependantsOf('ab'), resolveArray(['a', 'b']))
  t.deepEqual(graph.dependantsOf('nonexistent'), [])
})
