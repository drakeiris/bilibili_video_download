/*
 * 参考资料：
 * https://github.com/Xmader/bilitwin
 * https://github.com/blogwy/BilibiliVideoDownload
 */
const readlineSync = require('readline-sync')
    , rp = require('request-promise')
    , fs = require('fs')
    , cheerio = require('cheerio')

/* 
* options：
* SESSDATA: 控制台->Application->Storage->Cookies->SESSDATA，改成自己的
* qn：quality，最高视频清晰度，返回的 qn <= 设置的 qn
*/
const SESSDATA = ''
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
            const { cid } = page
                , dir = pages.length > 1 ? title : ''

            let { part } = page
            part = part ? part : title

            let downloadInfo = await rp({
                uri: `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`,
                headers: HEADERS
            })

            let durl = JSON.parse(downloadInfo).data.durl
            if (durl.length < 2) {
                // 无分段
                return [{
                    dir,
                    title,
                    part,
                    out: part,
                    url: durl[0].url
                }]
            } else {
                // 有分段
                return durl.map((value, index) => {
                    return {
                        dir,
                        title,
                        part,
                        out: `${part}-${index}`,
                        url: value.url
                    }
                })
            }
        }))
    }

    static async Bangumi(ss) {
        let bangumiInfo = await rp(`https://api.bilibili.com/pgc/web/season/section?season_id=${ss}`)
        const pages = JSON.parse(bangumiInfo).result.main_section.episodes

        return Promise.all(pages.map(async page => {
            const { id, title: episode, long_title } = page
                , $ = await rp({
                    uri: `https://www.bilibili.com/bangumi/media/md${ss}`,
                    headers: HEADERS,
                    gzip: true,
                    transform: function (body) {
                        return cheerio.load(body)
                    }
                })

            let title = $('meta[name=keywords]').attr('content')
            let downloadInfo = await rp({
                uri: `https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`,
                headers: HEADERS
            })

            let durl = JSON.parse(downloadInfo).result.durl
            if (durl.length < 2) {
                return [{
                    dir: title,
                    title,
                    part: long_title,
                    out: `第${episode}集-${long_title}`,
                    url: durl[0].url
                }]
            } else {
                return durl.map((value, index) => {
                    return {
                        dir: title,
                        title,
                        part: long_title,
                        out: `第${episode}集-${long_title}-${index}`,
                        url: value.url
                    }
                })
            }
        }))
    }

    static show(infos) {
        console.log(`\n`)
        if (infos.length < 2) {
            console.log(`[1] ALL`)
            infos[0].map((pages, index) => {
                index += 2
                console.log(`[${index}] ${pages[0].part}`)
            })
            console.log(`[0] CANCEL`)
        } else {
            infos.map((info, index) => {
                console.log(`[${index}] ${info[0][0].title}`)
                index++
            })
        }
        console.log(`\n`)
    }

    static async get(type) {
        const sss = readlineSync.question('请输入视频的 av 号或者番剧的 season_id（以空格分隔）:').split(' ')
        if (type == '0') {
            return Promise.all(avs.map(async av => await Info.Vedio(av)))
        } else if (type == '1') {
            return Promise.all(sss.map(async ss => await Info.Bangumi(ss)))
        } else {
            return []
        }
    }
}

class Exporter {
    static IDM(infos) {
        let data = []
        infos.map(info => info.map(pages => pages.map(page => {
            data.push(`<\r\n${page.url}\r\nreferer: ${REFERER}\r\n>\r\n`)
        })))
        fs.writeFile('./download.ef2', data.join(','), (err) => {
            if (err) throw err
            console.log('完成')
        })
    }
    static Aria2(infos) {
        let data = []
        infos.map(info => info.map(pages => pages.map(page => {
            data.push(`${page.url}\r\n referer=${REFERER}\r\n dir=${BASEDIR}${page.dir}\r\n out=${page.out}.FLV\r\n`)
        })))
        fs.writeFile('./download.txt', data.join(','), (err) => {
            if (err) throw err
            console.log('完成')
        })
    }
    static Aria2RPC(infos) {
        infos.map(info => info.map(pages => pages.map(page => {
            rp({
                uri: `${ARIA2RPC}`,
                method: 'POST',
                body: {
                    id: '',
                    jsonrpc: 2,
                    method: "aria2.addUri",
                    params: [
                        [page.url],
                        { 'referer': `${REFERER}`, 'out': `${page.out}.FLV`, 'dir': `${BASEDIR}${page.dir}` }
                    ]
                },
                json: true
            })
        })))
    }
}

(async () => {
    const vedioType = readlineSync.keyInSelect(['视频', '番剧'], '请选择视频类型:')
    if (vedioType == 0) return

    let infos = await Info.get(vedioType)
    Info.show(infos)

    if (infos.length < 2) {
        console.log('只有一个视频，可选择具体 Part 或集数。')
        let avs = readlineSync.question('请选择需要下载的序号，1 为全部内容:').split(' ')
        if (avs.includes('0')) return
        if (!avs.includes('1')) {
            let res = [[]]
            for (let i of avs) {
                if (i < infos[0].length) {
                    res[0].push(infos[0][i])
                }
            }
            infos = res
        }
    }

    const exporterType = readlineSync.keyInSelect(['IDM', 'Aria2', 'Aria2RPC'], '请选择导出方式:')
    switch (parseInt(exporterType)) {
        case 0: Exporter.IDM(infos); break;
        case 1: Exporter.Aria2(infos); break;
        case 2: Exporter.Aria2RPC(infos); break;
        default: break;
    }
})()
