/*
 * 参考资料：
 * https://github.com/Xmader/bilitwin
 * https://github.com/blogwy/BilibiliVideoDownload
 */
const rp = require('request-promise')
    , fs = require('fs')
    , readline = require('readline')
    , Exporter = require('./utils/Exporter')
    , Download = require('./utils/Download')

    /* 
 * options：
 * SESSDATA: 控制台->Application->Storage->Cookies->SESSDATA，改成自己的
 * qn：quality，最高视频清晰度，返回的 qn <= 设置的 qn
 */
const SESSDATA = ''
    , REFERER = 'https://www.bilibili.com'
    , QN = 116
    , headers = {
        'Cookie': `SESSDATA=${SESSDATA}`
        , 'Referer': `${REFERER}`
    }
    , ARIA2RPC = 'http://localhost:6800/jsonrpc'
    , BASEDIR = '/share/CACHEDEV2_DATA/Vedio/Download/' // 必须以 '/' 结尾

class Info {
    static async Vedio(av) {
        let res = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${av}`)
        const { aid, title, pages } = JSON.parse(res).data

        return Promise.all(pages.map(async page => {
            const { part, cid } = page
            let res, durl

            res = await rp({
                uri: `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`,
                headers: headers
            })
            durl = JSON.parse(res).data.durl

            if (durl.length < 2) {
                return [{
                    dir: '',
                    part,
                    url: durl[0].url
                }]
            } else {
                return durl.map((value, index) => {
                    return {
                        dir: title,
                        part: `${part}-${index}`,
                        url: value.url
                    }
                })
            }
        }))
    }

    static async Bangumi(name, ss) {
        let res = await rp(`https://api.bilibili.com/pgc/web/season/section?season_id=${ss}`)
        const pages = JSON.parse(res).result.main_section.episodes

        return Promise.all(pages.map(async page => {
            const { id, title, long_title } = page
            let res, durl

            res = await rp({
                uri: `https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`,
                headers: headers
            })
            durl = JSON.parse(res).result.durl

            if (durl.length < 2) {
                return [{
                    dir: name,
                    part: `第${title}集-${long_title}`,
                    url: durl[0].url
                }]
            } else {
                return durl.map((value, index) => {
                    return {
                        dir: name,
                        part: `第${title}集-${long_title}-${index}`,
                        url: value.url
                    }
                })
            }
        }))
    }
}

(async () => {

})()
