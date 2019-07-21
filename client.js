// client request example
const zlib = require('zlib')
    , https = require('https')
    , fs = require('fs')

const request = https.get('https://api.bilibili.com/x/v1/dm/list.so?oid=71163662')
request.on('response', (response) => {
    const output = fs.createWriteStream('index.xml')
    response.pipe(zlib.createInflateRaw()).pipe(output)
})
