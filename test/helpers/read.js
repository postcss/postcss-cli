'use strict'

import { readFile } from 'fs-extra'

export default function (path) {
  return readFile(path, 'utf8')
}
