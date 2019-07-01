// ==UserScript==
// @name        bilibili_vedio_download
// @namespace   http://evgo2017.com/
// @homepageURL https://github.com/evgo2017/bilibili_vedio_download
// @supportURL  https://github.com/evgo2017/bilibili_vedio_download/issues
// @description bilibili/哔哩哔哩视频/番剧下载，目前仅支持单个（当前页）视频下载，支持大会员视频下载（需要用户本身是大会员），IDM，Aria2，Aria2RPC 导出方式。详细内容请在 Github 查看。参考资料：https://github.com/Xmader/bilitwin/ && https://github.com/blogwy/BilibiliVideoDownload
// @match       *://www.bilibili.com/video/av*
// @match       *://www.bilibili.com/bangumi/play/ep*
// @match       *://www.bilibili.com/bangumi/play/ss*
// @match       *://space.bilibili.com/*/favlist*
// @match       *://space.bilibili.com/*/bangumi*
// @match       *://space.bilibili.com/*/cinema*
// @version     1.0.0
// @license     MIT License
// @author      evgo2017
// @copyright   evgo2017
// @grant       none
// @run-at      document-start
// ==/UserScript==
(async function () {
    'use strict';
    const REFERER = 'https://www.bilibili.com'
        , BASEDIR = '/data/' // 末尾一定要有 '/'
        , ARIA2RPC = 'http://localhost:6800/jsonrpc'
        , ARIA2TOKEN = '' // Aria2 Secret Token
        , QN = 116

    function rp(url) {
        let xhr = new XMLHttpRequest()
        xhr.withCredentials = true
        xhr.open('GET', url, false)
        xhr.send()
        return xhr.responseText
    }
    class Vedio {
        static async part(vedio) {
            let { dir, id: aid, cid, part } = vedio
            part = part ? part : dir

            let downloadInfo = await rp(`https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`)

            let durl = JSON.parse(downloadInfo).data.durl
            if (durl.length < 2) {
                // 无分段
                return [[{ dir, part, out: part, url: durl[0].url }]]
            } else {
                // 有分段
                return [durl.map((value, index) => {
                    return { dir, part, out: `${part}-${index}`, url: value.url }
                })]
            }
        }
        static async allPart(vedio) {
            let { dir, id: aid } = vedio
            let vedioInfo = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`)
            const { pages } = JSON.parse(vedioInfo).data

            return Promise.all(pages.map(async page => {
                const { cid } = page

                let { part } = page
                part = part ? part : title

                let downloadInfo = await rp(`https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`)

                let durl = JSON.parse(downloadInfo).data.durl
                if (durl.length < 2) {
                    // 无分段
                    return [{ dir, part, out: part, url: durl[0].url }]
                } else {
                    // 有分段
                    return durl.map((value, index) => {
                        return { dir, part, out: `${part}-${index}`, url: value.url }
                    })
                }
            }))
        }
    }
    class Bangumi {
        static async part(bangumi) {
            let { dir, id: ep_id, part, episode } = bangumi
            part = part ? part : dir

            let downloadInfo = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${ep_id}&qn=${QN}&otype=json`)

            console.log(downloadInfo)
            let durl = JSON.parse(downloadInfo).result.durl
            if (durl.length < 2) {
                return [[{ dir, part, out: `第${episode}集-${part}`, url: durl[0].url }]]
            } else {
                return [durl.map((value, index) => {
                    return { dir, part, out: `第${episode}集-${part}-${index}`, url: value.url }
                })]
            }
        }
        static async allPart(bangumi) {
            let { dir, id: ss } = bangumi
            let bangumiInfo = await rp(`https://api.bilibili.com/pgc/web/season/section?season_id=${ss}`)
            const pages = JSON.parse(bangumiInfo).result.main_section.episodes

            return Promise.all(pages.map(async page => {
                const { id, title: episode, long_title: part } = page

                let downloadInfo = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)

                let durl = JSON.parse(downloadInfo).result.durl
                if (durl.length < 2) {
                    return [{ dir, part, out: `第${episode}集-${part}`, url: durl[0].url }]
                } else {
                    return [durl.map((value, index) => {
                        return { dir, part, out: `第${episode}集-${part}-${index}`, url: value.url }
                    })]
                }
            }))
        }
    }
    class Info {
        // @match       *://www.bilibili.com/video/av*
        // @match       *://www.bilibili.com/bangumi/play/ep*
        // @match       *://space.bilibili.com/*/favlist*
        // @match       *://space.bilibili.com/*/bangumi*
        // @match       *://space.bilibili.com/*/cinema*
        static async get() {
            let currentURL = window.location.href
            if (currentURL.search('space') > -1) {
                // 收藏/订阅/追剧 批量
                const up_mid = /\d+/.exec(currentURL)[0]
                if (currentURL.search('favlist') > -1) {
                    // @match *://space.bilibili.com/*/favlist*
                    // 收藏
                    let infos = []
                    const mediaList = await rp(`https://api.bilibili.com/medialist/gateway/base/created?pn=1&ps=100&up_mid=${up_mid}&is_space=0&jsonp=jsonp`)
                    const favlists = JSON.parse(mediaList).data.list

                    let media_id, media_count
                    if (window.location.search) {
                        media_id = /\d+/.exec(window.location.search)[0]
                        for (let fav of favlists) {
                            if (media_id == fav.id) {
                                media_count = fav.media_count
                            }
                        }
                    } else {
                        media_id = favlists[0].id
                        media_count = favlists[0].media_count
                    }

                    let maxPn = media_count / 20 + 1
                    for (let pn = 1; pn < maxPn; pn++) {
                        let res = await rp(`https://api.bilibili.com/medialist/gateway/base/spaceDetail?media_id=${media_id}&ps=20&pn=${pn}&keyword=&order=mtime&type=0&tid=0&jsonp=jsonp`)
                        let medias = JSON.parse(res).data.medias
                        for (let media of medias) {
                            let { title, id, page: total_count } = media
                            infos.push({ title, id, total_count })
                        }
                    }
                    return infos
                } else if (currentURL.search('bangumi') > -1) {
                    // @match *://space.bilibili.com/*/favlist*
                    // 追番
                    let infos = []
                    let type = 1
                    let ts = Date.parse(new Date())
                    let res = await rp(`https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=1&ps=15&vmid=${up_mid}&ts=${ts}`)
                    const { pn: maxPn } = JSON.parse(res).data
                    let { list } = JSON.parse(res).data
                    // title, season_id, total_count
                    list.forEach(bangumi => {
                        let { title: dir, season_id: id, total_count } = bangumi
                        infos.push({ dir, id, total_count })
                    })
                    for (let pn = 2; pn <= maxPn; pn++) {
                        // 说明有多页，需要多次获取
                        res = await rp(`https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=${pn}&ps=15&vmid=${up_mid}&ts=${ts}`)
                        list = JSON.parse(res).data
                        list.forEach(bangumi => {
                            let { title: dir, season_id: id, total_count } = bangumi
                            infos.push({ dir, id, total_count })
                        })
                    }
                    return infos
                } else if (currentURL.search('cinema') > -1) {
                    // @match *://space.bilibili.com/*/cinema*
                    // 追剧 优化，与番剧仅差在 type 值
                    let infos = []
                    let type = 2
                    let ts = Date.parse(new Date())
                    let res = await rp(`https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=1&ps=15&vmid=${up_mid}&ts=${ts}`)
                    const { pn: maxPn } = JSON.parse(res).data
                    let { list } = JSON.parse(res).data
                    // title, season_id, total_count
                    list.forEach(bangumi => {
                        let { title: dir, season_id, total_count } = bangumi
                        infos.push({ dir, id: season_id, total_count })
                    })
                    for (let pn = 2; pn <= maxPn; pn++) {
                        // 说明有多页，需要多次获取
                        res = await rp(`https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=${pn}&ps=15&vmid=${up_mid}&ts=${ts}`)
                        list = JSON.parse(res).data
                        list.forEach(bangumi => {
                            let { title: dir, season_id: id, total_count } = bangumi
                            infos.push({ dir, id, total_count })
                        })
                    }
                    return infos
                }
            } else {
                // 单个
                if (currentURL.search('video') > -1) {
                    // @match *://www.bilibili.com/video/av*
                    // 视频
                    let avState = async function () {
                        // 单/全 Part
                        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData.pages) {
                            let inital = window.__INITIAL_STATE__
                                , { aid, videoData } = inital
                            let p = window.location.search ? /\d+/.exec(window.location.search)[0] - 1 : 0
                                , { cid, part } = videoData.pages[p]
                                , total_count = videoData.pages.length
                                , dir = document.querySelector('#viewbox_report h1').title
                            // 文件夹名称不可以包含 \/:?*"<>|
                            dir = dir.replace(/[\\\/:?*"<>|]/ig, '-')

                            let vedio = { dir, id: aid, total_count, cid, part }
                                , info = await Vedio.part(vedio)
                            console.log(info)
                            return info
                        } else {
                            setTimeout(avState, 1000)
                        }
                    }
                    setTimeout(avState, 1000)
                } else if (currentURL.search('bangumi') > -1) {
                    // @match *://www.bilibili.com/bangumi/play/ep*
                    // 番剧
                    let epStatus = async function () {
                        // 单/全集
                        // 当前 epInfo，全 epList
                        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.epStatus >= 2) {
                            let { id, title: episode, longTitle: part } = window.__INITIAL_STATE__.epInfo
                                , dir = document.querySelector('.media-title').title
                            // 文件夹名称不可以包含 \/:?*"<>|
                            dir = dir.replace(/[\\\/:?*"<>|]/ig, '-')

                            let bangumi = { dir, id, total_count: 1, part, episode }
                                , info = await Bangumi.part(bangumi)
                            console.log(info)
                            return info
                        } else {
                            setTimeout(epStatus, 1000)
                        }
                    }
                    setTimeout(epStatus, 1000)
                }
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
    Info.get()
})()
