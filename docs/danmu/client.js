// client request example
const zlib = require('zlib')
    , https = require('https')
    , fs = require('fs')

// 从网站获得数据
const request = https.get('https://api.bilibili.com/x/v1/dm/list.so?oid=71163662')
request.on('response', (response) => {
    const output = fs.createWriteStream('index.xml')
    response.pipe(zlib.createInflateRaw()).pipe(output)
})

// 直接解压
const request2 = fs.createReadStream('list.so')
const output2 = fs.createWriteStream('list.xml')
request2.pipe(zlib.createInflateRaw()).pipe(output2)
