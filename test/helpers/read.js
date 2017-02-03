'use strict'

import { readFile } from 'fs-promise'

export default function (path) {
  return readFile(path, 'utf8')
}
