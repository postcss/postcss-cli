import { readFile } from 'fs-extra'

export default function(path) {
  return readFile(path, 'utf8').then(content => content.replace(/\r\n/g, '\n')) // normalize line endings on Windows
}
