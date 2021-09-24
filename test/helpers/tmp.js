import path from 'path'
import { v4 as uuid } from 'uuid'

export default function (ext) {
  ext = ext || ''

  return path.join('test/fixtures/.tmp', uuid(), ext)
}
