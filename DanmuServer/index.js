const fs = require('fs')
, http = require('http')
    , https = require('https')
    , zlib = require('zlib')
    , path = require('path')
    , xml2js = require('xml2js')
    , jayson = require('jayson')
    , cors = require('cors')
    , connect = require('connect')
    , jsonParser = require('body-parser').json
    , app = connect()

const portRPC = 6801

function distinct(a, b) {
    let arr = a.concat(b)
        , result = []
        , obj = {}

    for (let i of arr) {
        if (!obj[i['$'].p]) {
            result.push(i)
            obj[i['$'].p] = 1
        }
    }
    return result
}

const server = jayson.server({
  add: function(args, callback) {
    const { dir, out, url } = args
        , file = path.join(dir, out)
    https.get(url, (res) => {
        res.on('data', (data) => {
            if(fs.existsSync(file)) {
                // 文件存在则补充
                zlib.inflateRaw(data, (e, buffer) => {
                    if(e) throw e
                    new xml2js.parseString(buffer.toString(), (e, newData) => {
                        if(e) throw e
                        fs.readFile(file, (e, oldFile) => {
                            if(e) throw e
                            new xml2js.parseString(oldFile.toString(), (e, oldData) => {
                                if(e) throw e
                                oldData.i.d = distinct(oldData.i.d, newData.i.d)
                                fs.writeFile(file, new xml2js.Builder().buildObject(oldData), function(e){
                                    if (e) throw event
                                    console.log(`【${dir}】 ${out} 文件已更新`)
                                })
                            })
                        })
                    }) 
                })
            } else {
                // 不存在则直接写入
                fs.mkdir(path.join(dir), { recursive: true }, (e) => {
                    if (e) throw e
                    zlib.inflateRaw(data, (e, buffer) => {
                        if (e) throw e
                        fs.writeFile(file, buffer, function(e) {
                            if (e) throw e
                            console.log(`【${dir}】 ${out} 文件已下载`)
                        })
                    })
                })
            }
        })
    }).on('error', (e) => {
        console.error(e)
    })
    callback(null, args.out)
  }
})

app.use(cors({methods: ['POST']}))
app.use(jsonParser())
app.use(server.middleware())

app.listen(portRPC)
