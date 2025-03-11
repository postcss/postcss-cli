import fs from 'fs-extra'
import path from 'path'
import { glob } from 'tinyglobby'

import tmp from './tmp.js'

export default function (config, fixtures = '**/*', extension = 'cjs') {
  const dir = tmp()

  return Promise.all([
    glob(fixtures, { cwd: 'test/fixtures' }).then((list) => {
      return list.map((item) => {
        return fs.copy(path.join('test/fixtures', item), path.join(dir, item))
      })
    }),
    fs.outputFile(path.join(dir, `postcss.config.${extension}`), config),
  ]).then(() => dir)
}
