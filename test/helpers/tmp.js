'use strict'

import path from 'path'
import uuid from 'uuid'

export default function (ext) {
  ext = ext || ''

  return path.join('test/fixtures/.tmp', uuid(), ext)
}
