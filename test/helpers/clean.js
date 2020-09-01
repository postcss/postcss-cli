'use strict'
const fs = require('fs-extra')

Promise.all([
  fs.emptyDir('./test/fixtures/.tmp/'),
  fs.remove('./coverage'),
  fs.remove('./.nyc_output'),
]).catch((err) => {
  console.error(err)
  process.exit(1)
})
