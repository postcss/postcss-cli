'use strict'
module.exports = function (results) {
  if (!Array.isArray(results)) results = [results]
  let arr = []

  results
  .forEach(result => {
    result.messages
    .filter(msg => msg.type === 'dependency' ? msg : '')
    .forEach(dep => arr.push(dep.file))
  })
  return arr
}
