import fs from 'node:fs/promises'
import path from 'path'
import { glob } from 'tinyglobby'

import tmp from './tmp.js'

export default function (config, fixtures = '**/*', extension = 'cjs') {
  const dir = tmp()

  return fs.mkdir(dir, { recursive: true }).then(() =>
    Promise.all([
      glob(fixtures, { cwd: 'test/fixtures' }).then((list) => {
        return Promise.all(
          list.map(async (item) => {
            const dest = path.join(dir, item)
            await fs.mkdir(path.dirname(dest), { recursive: true })
            return fs.copyFile(path.join('test/fixtures', item), dest)
          }),
        )
      }),
      fs.writeFile(path.join(dir, `postcss.config.${extension}`), config),
    ]).then(() => dir),
  )
}
