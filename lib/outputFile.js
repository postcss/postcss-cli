import fs from 'node:fs/promises'
import path from 'node:path'

export default async function outputFile(file, string) {
  try {
    const currentValue = await fs.readFile(file, 'utf8')
    if (currentValue === string) return
  } catch {}
  await fs.mkdir(path.dirname(file), { recursive: true })
  return fs.writeFile(file, string)
}
