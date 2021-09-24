import fs from 'fs-extra'

Promise.all([
  fs.emptyDir('./test/fixtures/.tmp/'),
  fs.remove('./coverage'),
]).catch((err) => {
  console.error(err)
  process.exit(1)
})
