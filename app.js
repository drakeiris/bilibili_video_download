/*
 * 参考资料：
 * https://github.com/Xmader/bilitwin
 * https://github.com/blogwy/BilibiliVideoDownload
 */
const rp = require('request-promise')
    , fs = require('fs')

/* 
 * options：
 * SESSDATA: 控制台->Application->Storage->Cookies->SESSDATA，改成自己的
 * qn：quality，最高视频清晰度，返回的 qn <= 设置的 qn
 */
const SESSDATA = ''
    , qn = 116
    , referer = 'https://www.bilibili.com'
    , aria2RPC = 'http://localhost:6800/jsonrpc'

const getInfo = async aid => {
    let res = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`)
    return JSON.parse(res).data
}
const getURLs = async info => {
    const { aid, pages } = info
    return Promise.all(pages.map(async value => {
        const title = value.part
            , cid = value.cid

        let res = await rp({
            uri: `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${qn}&otype=json`,
            headers: {
                'Cookie': 'SESSDATA=' + SESSDATA
                , 'Referer': referer
            }
        })
        let durls = JSON.parse(res).data.durl
        if (durls.length<2) {
            return {
                title: title,
                url: durls[0].url
            }
        } else {
            // 待完善: 多P多段
            return durls.map((durl, index) => {
                return {
                    title: `${title}-${index}`,
                    url: durl.url
                }
            })
        }
    }))
}
const exportIDM = urls => {
    let data = urls.map(value => `<\r\n${value.url}\r\nreferer: ${referer}\r\n>\r\n`).join('')
    fs.writeFileSync('./idm.ef2', data)
}
const exportAria2 = urls => {
    let data = urls.map(value => `${value.url}\r\n referer=${referer}\r\n out=${value.title}.FLV\r\n`).join('')
    fs.writeFileSync('./aria2.txt', data)
}
const sendToAria2RPC = async urls => {
    urls.map(value => {
        rp({
            uri: aria2RPC,
            method: 'POST',
            body: {
                id: '',
                jsonrpc: 2,
                method: "aria2.addUri",
                params: [
                    [value.url],
                    { 'referer': referer, 'out': `${value.title}.FLV` }
                ]
            },
            json: true
        })
    })
}

(async () => {
    let aid = ''

    let info = await getInfo(aid)
        , urls = await getURLs(info)

    exportIDM(urls)
    exportAria2(urls)
})()
