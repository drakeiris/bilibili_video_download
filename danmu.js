const http = require('http')
    , exec = require('child_process').exec
    , path = require('path')
    , zlib = require('zlib')
    , fs = require('fs')
    , port = 7777

console.log("Danmu API Server is running " + port)
http.createServer(function (req, res) {
    // const id = req.params.id
    // console.log(req.url)
    // console.log(req.params)
    zlib.deflate("<p style='color:red'>Hello world!</p>", (err, buffer) => {
        if (!err) {
            res.writeHead(200, { 'Content-Encoding': 'deflate' })
            res.end(buffer)
        } else {
            // handle error
        }
    });
    // res.writeHead(200, { 'Content-Type': 'text/html' })
    // res.write('<h1>Node.js</h1>')
    // res.end("<p style='color:red'>Hello world!</p>");
    // curl -Uri https://comment.bilibili.com/71163662.xml -OutFile C:\data\2.xml
    // let dockerCompose = exec(`curl -Uri https://api.bilibili.com/x/v1/dm/list.so?oid=${id} -OutFile ${path.join('C:','data','index.xml')}`, {})
    // // let dockerCompose = exec(`curl -O https://api.bilibili.com/x/v1/dm/list.so?oid=${id} --compressed`, {})
    // dockerCompose.stdout.on('data', function (data) {
    //     console.log('stdout: ' + data);
    // })
    // dockerCompose.stderr.on('data', function (data) {
    //     console.log('stderr: ' + data);
    // })
}).listen(port)
