import fs from 'node:fs/promises'

export default function (path) {
  return fs.readFile(path, 'utf8').then(
    (content) => content.replace(/\r\n/g, '\n'), // normalize line endings on Windows
  )
}
