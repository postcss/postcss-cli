'use strict'

const fs = require('fs-promise')

fs.emptyDir('./test/fixtures/.tmp/')

fs.remove('./coverage')
fs.remove('./.nyc_output')
