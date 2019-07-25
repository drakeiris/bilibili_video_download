const fs = require('fs')
    , zlib = require('zlib')
    , path = require('path')
    , xml2js = require('xml2js')
    , jayson = require('jayson')
    , cors = require('cors')
    , connect = require('connect')
    , jsonParser = require('body-parser').json
    , app = connect()
    , request = require('request')

const portRPC = 6801
    , logFile='./log.html'

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
function addLog(str) {
    fs.appendFile(logFile, `<p>${new Date()}：${str}<p>`, (e) => {
        if(e) throw e
        console.log(str)
    })
}

const server = jayson.server({
  add: function(args, callback) {
    const { dir, out, url } = args
        , file = path.join(dir, out)
        , tempFile = path.join(dir, `new${out}`)
    if(fs.existsSync(file)) {
        let ws = fs.createWriteStream(tempFile)
        request(url).pipe(zlib.createInflateRaw()).pipe(ws)
        let oldFileData = fs.readFileSync(file).toString()
        ws.on('finish', function() {
            let newFileData = fs.readFileSync(tempFile).toString()
            new xml2js.parseString(oldFileData, (e, oldData) => {
                if(e) throw e
                new xml2js.parseString(newFileData, (e, newData) => {
                    if(e) throw e
                    newData.i.d = distinct(newData.i.d, oldData.i.d)
                    let result = new xml2js.Builder().buildObject(newData)
                    fs.writeFileSync(file, result)
                    fs.unlinkSync(tempFile)
                    addLog(`【${dir}】 ${out} 文件已更新`)
                })
            })
        })
    } else {
        fs.mkdir(path.join(dir), { recursive: true }, (e) => {
            if (e) throw e
        })
        let ws = fs.createWriteStream(file)
        request(url).pipe(zlib.createInflateRaw()).pipe(ws)
        ws.on('finish', function() {
            addLog(`【${dir}】 ${out} 文件已下载`)
        })
    }
    callback(null, args.out)
  }
})

app.use(cors({methods: ['POST']}))
app.use(jsonParser())
app.use(server.middleware())

app.listen(portRPC, function(e){
    if(e) throw e
    console.log(portRPC)
})
