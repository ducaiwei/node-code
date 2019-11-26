const {createReadStream} = require('fs');
const path = require('path');

const stream = createReadStream(path.resolve(__dirname, 'package.json'));
console.log(stream.pipe());