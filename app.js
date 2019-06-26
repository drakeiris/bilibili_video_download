/*
 * 参考资料：
 * https://github.com/Xmader/bilitwin
 * https://github.com/blogwy/BilibiliVideoDownload
 */
const readlineSync = require('readline-sync')
    , rp = require('request-promise')
    , fs = require('fs')

/* 
 * options：
 * SESSDATA: 控制台->Application->Storage->Cookies->SESSDATA，改成自己的
 * qn：quality，最高视频清晰度，返回的 qn <= 设置的 qn
 */
const SESSDATA = 'bd3a8286%2C1561801818%2C67b64751'
    , QN = 116
    , REFERER = 'https://www.bilibili.com'
    , HEADERS = {
        'Cookie': `SESSDATA=${SESSDATA}`
        , 'Referer': REFERER
    }
    , BASEDIR = '/share/CACHEDEV2_DATA/Vedio/Download/' // 必须以 '/' 结尾
    , ARIA2RPC = 'http://localhost:6800/jsonrpc'

class Info {
    static async Vedio(av) {
        let vedioInfo = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${av}`)
        const { aid, title, pages } = JSON.parse(vedioInfo).data

        return Promise.all(pages.map(async page => {
            const { part, cid } = page

            let downloadInfo = await rp({
                uri: `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`,
                headers: HEADERS
            })

            let durl = JSON.parse(downloadInfo).data.durl
            if (durl.length < 2) {
                return [{
                    dir: '',
                    title,
                    part,
                    url: durl[0].url
                }]
            } else {
                return durl.map((value, index) => {
                    return {
                        dir: title,
                        title,
                        part,
                        index,
                        url: value.url
                    }
                })
            }
        }))
    }

    static async Bangumi(name, ss) {
        let bangumiInfo = await rp(`https://api.bilibili.com/pgc/web/season/section?season_id=${ss}`)
        const pages = JSON.parse(bangumiInfo).result.main_section.episodes

        return Promise.all(pages.map(async page => {
            const { id, title, long_title } = page

            let downloadInfo = await rp({
                uri: `https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`,
                headers: HEADERS
            })

            let durl = JSON.parse(downloadInfo).result.durl
            if (durl.length < 2) {
                return [{
                    dir: name,
                    index: title,
                    part: long_title,
                    out: `第${title}集-${long_title}`,
                    url: durl[0].url
                }]
            } else {
                return durl.map((value, index) => {
                    return {
                        dir: name,
                        index,
                        out: `第${title}集-${long_title}-${index}`,
                        url: value.url
                    }
                })
            }
        }))
    }
}

class Exporter {
    static IDM(infos) {
        let data = []
        infos.map(info => {
            info.map(pages => {
                pages.map(page => {
                    data.push(`<\r\n${page.url}\r\nreferer: ${REFERER}\r\n>\r\n`)
                })
            })
        })
        fs.appendFile('./download.ef2', data.join(','), () => {
            if (err) throw err
            console.log(err)
        })
    }
    static Aria2(infos) {
        let data = []
        infos.map(info => {
            info.map(pages => {
                pages.map(page => {
                    data.push(`${page.url}\r\n referer=${REFERER}\r\n dir=${BASEDIR}${page.dir}\r\n out=${page.part}.FLV\r\n`)
                })
            })
        })
        fs.appendFile('./download.txt', data.join(','), () => {
            if (err) throw err
            console.log(err)
        })
    }
    static Aria2RPC(infos) {
        infos.map(info => {
            info.map(pages => {
                pages.map(page => {
                    rp({
                        uri: ARIA2RPC,
                        method: 'POST',
                        body: {
                            id: '',
                            jsonrpc: 2,
                            method: "aria2.addUri",
                            params: [
                                [page.url],
                                { 'referer': `${REFERER}`, 'out': `${page.part}.FLV`, 'dir': `${BASEDIR}${page.dir}` }
                            ]
                        },
                        json: true
                    })
                })
            })
        })
    }
}

class Type {
    static async Vedio() {
        let avs = readlineSync.question('请输入视频的 av 号（多个则以空格分隔）:').split(' ')
        return Promise.all(avs.map(async av => {
            let info = await Info.Vedio(av)
            return info
        }))
    }
    static async Bangumi() {
        const bangumi = readlineSync.question('请输入番剧的名称和 season_id（以空格分隔）:').split(' ')
        const name = bangumi[0], ss = bangumi[1]
        let res = await Info.Bangumi(name, ss)
        return [res]
    }
}

function showList(infos) {
    console.log(`\n[1] ALL`)
    let index = 2
    infos.map(info=> {
        info.map(pages => {
            pages.map(page => {
                if (index > 9) { index = String.fromCharCode(97 - 10 + index) }
                let title = page.part || page.title
                console.log(`[${index}] ${title}`)
                index++
            })
        })
    })
    console.log(`[0] CANCEL\n`)
}

(async () => {
    // let wayNum = readlineSync.keyInSelect(['IDM', 'Aria2', 'Aria2RPC'], 'Please choose one way to exporter:')
    let vedioType = readlineSync.keyInSelect(['单视频 部分/全 Part', '多视频 全 Part', '番剧 部分/全集'], '请选择一个视频类型:')
    let infos;
    if (parseInt(vedioType) == 0) {
        // 单视频 部分 || 全 Part 
        infos = await Type.Vedio()
        console.log(infos[0][0][0].title)
        showList(infos)
        let avs = readlineSync.question('请选择需要下载的视频 Part 序号（多个则以空格分隔）:').split(' ')
        if(avs.includes(0)) {
            infos =  []
        } else if(avs.includes(1)) {}
        else {
            let res = [[]]
            for(let i of avs) {
                res[0].push(infos[0][i-2])
            }
            infos = res
            console.log(res[0][0][0].part)
        }
    } else if (parseInt(vedioType) == 1) {
        // 多视频 全 Part
        infos = await Type.Vedio()
        console.log('所有视频名称：')
        showList(infos)
        let avs = readlineSync.question('请选择需要下载的视频序号（多个则以空格分隔）:').split(' ')
        if(avs.includes(0)) {
            infos =  []
        } else if(avs.includes(1)) {}
        else {
            let res = []
            for(let i of avs) {
                res.push(infos[i-2])
            }
            infos = res
            console.log(res[0][0][0].title)
        }
    } else if (parseInt(vedioType) == 2) {
        // 单番剧 部分 || 全集
        infos = await Type.Bangumi()
        console.log(infos)
        console.log('所有集名称：')
        showList(infos)
    }

    // switch (wayNum) {
    //     case 0: this.IDM(info); break;
    //     case 1: this.Aria2(info); break;
    //     case 2: this.Aria2RPC(info); break;
    //     default: break;
    // }
})()
