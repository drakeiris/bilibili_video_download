const http = require('http')
    , zlib = require('zlib')
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
