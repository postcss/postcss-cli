import fs from 'node:fs/promises'
import path from 'path'
import { glob } from 'tinyglobby'

import tmp from './tmp.js'

export default async function (config, fixtures = '**/*', extension = 'cjs') {
  const dir = tmp()

  await fs.mkdir(dir, { recursive: true })

  const list = await glob(fixtures, { cwd: 'test/fixtures' })

  await Promise.all([
    ...list.map(async (item) => {
      const dest = path.join(dir, item)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.copyFile(path.join('test/fixtures', item), dest)
    }),
    fs.writeFile(path.join(dir, `postcss.config.${extension}`), config),
  ])

  return dir
}
