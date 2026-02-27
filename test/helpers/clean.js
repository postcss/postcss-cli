import fs from 'node:fs/promises'

Promise.all([
  fs
    .rm('./test/fixtures/.tmp/', { recursive: true, force: true })
    .then(() => fs.mkdir('./test/fixtures/.tmp/', { recursive: true })),
  fs.rm('./coverage', { recursive: true, force: true }),
]).catch((err) => {
  console.error(err)
  process.exit(1)
})
