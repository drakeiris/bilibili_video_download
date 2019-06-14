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

const getInfo = async aid => {
    let res = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`)
    return JSON.parse(res).data.pages.map(v => {
        v.aid = aid
        return v
    })
}
const getURLs = async info => {
    return Promise.all(info.map(async value => {
        const aid = value.aid
            , cid = value.cid

        let res = await rp({
            uri: `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${qn}&otype=json`,
            headers: {
                'Cookie': 'SESSDATA=' + SESSDATA
                , 'Referer' : 'https://www.bilibili.com'
            }
        })
        let durls = JSON.parse(res).data.durl
        return durls.map(durl => durl.url)
    }))
}
const exportIDM = urls => {
    let data = urls.map(url => `<\r\n${url}\r\nreferer: https://www.bilibili.com\r\n>\r\n`).join('')
    fs.writeFileSync('./all.ef2', data)
}

(async () => {
    let aid = ''

    let info = await getInfo(aid)
        , urls = await getURLs(info)

    exportIDM(urls)
})()
