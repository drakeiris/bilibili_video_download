const http = require('http')
    , exec = require('child_process').exec
    , path = require('path')
    , zlib = require('zlib')
    , fs = require('fs')
    , port = 7777

console.log("Danmu API Server is running " + port)
http.createServer(function (req, res) {
    zlib.deflate("<p style='color:red'>Hello world!</p>", (err, buffer) => {
        if (!err) {
            res.writeHead(200, { 'Content-Encoding': 'deflate' })
            res.end(buffer)
        } else {
            // handle error
        }
    })
}).listen(port)
