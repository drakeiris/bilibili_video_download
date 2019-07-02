// ==UserScript==
// @name        bilibili_vedio_download
// @namespace   http://evgo2017.com/
// @homepageURL https://github.com/evgo2017/bilibili_vedio_download
// @supportURL  https://github.com/evgo2017/bilibili_vedio_download/issues
// @description bilibili/哔哩哔哩视频/番剧下载，单/多P下载，单/多集下载，多视频/番剧下载，大会员（本身是），IDM，Aria2，Aria2RPC 导出方式。详细内容请在 Github 查看。参考资料：https://github.com/Xmader/bilitwin/ && https://github.com/blogwy/BilibiliVideoDownload
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

/*
 * 目前还在完善功能，待抽象、优化
 */
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
                return [[[{ dir, part, out: part, url: durl[0].url }]]]
            } else {
                // 有分段
                return [[durl.map((value, index) => {
                    return { dir, part, out: `${part}-${index}`, url: value.url }
                })]]
            }
        }
        static async allPart(vedio) {
            let { dir, id: aid } = vedio
            let vedioInfo = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`)
            const { pages } = JSON.parse(vedioInfo).data

            return Promise.all(pages.map(async page => {
                const { cid } = page
                let { part } = page
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
            }))
        }
        static async allVedio(vedios) {
            return Promise.all(vedios.map(async video => {
                let res = await Vedio.allPart(video)
                let ress = []
                res.forEach(r => {
                    ress.push(r[0])
                })
                return ress
            }))
        }
    }
    class Bangumi {
        static async part(bangumi) {
            let { dir, id, part, episode } = bangumi
            part = part ? part : dir
            let downloadInfo = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)

            let durl = JSON.parse(downloadInfo).result.durl
            if (durl.length < 2) {
                return [[[{ dir, part, out: `第${episode}集-${part}`, url: durl[0].url }]]]
            } else {
                return [[durl.map((value, index) => {
                    return { dir, part, out: `第${episode}集-${part}-${index}`, url: value.url }
                })]]
            }
        }
        static async allPart(bangumi) {
            let { dir, epList } = bangumi

            return Promise.all(epList.map(async page => {
                const { id, title: episode } = page
                const part = page.longTitle ? page.longTitle : page.long_title
                let downloadInfo = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)

                let durl = JSON.parse(downloadInfo).result.durl
                if (durl.length < 2) {
                    return [[{ dir, part, out: `第${episode}集-${part}`, url: durl[0].url }]]
                } else {
                    return [durl.map((value, index) => {
                        return { dir, part, out: `第${episode}集-${part}-${index}`, url: value.url }
                    })]
                }
            }))
        }
        static async allBangumi(bangumis) {
            return Promise.all(bangumis.map(async bangumi => {
                let bangumiInfo = await rp(`https://api.bilibili.com/pgc/web/season/section?season_id=${bangumi.id}`)
                bangumi.epList = JSON.parse(bangumiInfo).result.main_section.episodes
                let res = await Bangumi.allPart(bangumi)
                let ress = []
                res.forEach(r => {
                    ress.push(r[0])
                })
                return ress
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
                let exporterTypes = []
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
                            let { title: dir, id } = media
                            infos.push({ dir, id })
                        }
                    }

                    let infoss = await Vedio.allVedio(infos)
                    // 页面选择列表
                    exporterTypes.push('当前收藏夹')
                    exporterTypes.push(Exporter.IDM(infoss))
                    exporterTypes.push(Exporter.Aria2(infoss))
                    exporterTypes.push(Exporter.Aria2RPC(infoss))
                    Exporter.list(exporterTypes)
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

                    console.log(infos)
                    let infoss = await Bangumi.allBangumi(infos)
                    // 页面选择列表
                    exporterTypes.push('追剧')
                    exporterTypes.push(Exporter.IDM(infoss))
                    exporterTypes.push(Exporter.Aria2(infoss))
                    exporterTypes.push(Exporter.Aria2RPC(infoss))
                    Exporter.list(exporterTypes)
                } else if (currentURL.search('cinema') > -1) {
                    // @match *://space.bilibili.com/*/cinema*
                    // 追剧 优化，与番剧差在 type 值
                    let type = 2
                }
            } else {
                // 单个
                if (currentURL.search('video') > -1) {
                    // @match *://www.bilibili.com/video/av*
                    // 视频
                    let avState = async function () {
                        // 单/全 Part
                        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData.pages) {
                            let exporterTypes = []
                            let inital = window.__INITIAL_STATE__
                                , { aid, videoData } = inital
                            let p = window.location.search ? /\d+/.exec(window.location.search)[0] - 1 : 0
                                , { cid, part } = videoData.pages[p]
                                , total_count = videoData.pages.length
                                , dir = document.querySelector('#viewbox_report h1').title
                            // 文件夹名称不可以包含 \/:?*"<>|
                            dir = dir.replace(/[\\\/:?*"<>|]/ig, '-')
                            let infos = await Vedio.part({ dir, id: aid, total_count, cid, part })
                            // 页面选择列表
                            // 当前 Part
                            exporterTypes.push('此 Part')
                            exporterTypes.push(Exporter.IDM(infos))
                            exporterTypes.push(Exporter.Aria2(infos))
                            exporterTypes.push(Exporter.Aria2RPC(infos))
                            exporterTypes.push({})
                            // 全 Part
                            infos = await Vedio.allPart({ dir, id: aid })
                            exporterTypes.push('全 Part')
                            exporterTypes.push(Exporter.IDM(infos))
                            exporterTypes.push(Exporter.Aria2(infos))
                            exporterTypes.push(Exporter.Aria2RPC(infos))
                            Exporter.list(exporterTypes)
                        } else {
                            setTimeout(avState, 500)
                        }
                    }
                    setTimeout(avState, 500)
                } else if (currentURL.search('bangumi') > -1) {
                    // @match *://www.bilibili.com/bangumi/play/ep*
                    // 番剧
                    let epStatus = async function () {
                        // 单/全集
                        // 当前 epInfo，全 epList
                        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.id > -1 && window.__INITIAL_STATE__.epList) {
                            let exporterTypes = []
                            // 当前单集
                            let { id, title: episode, longTitle: part } = window.__INITIAL_STATE__.epInfo
                                , dir = document.querySelector('.media-title').title
                            // 文件夹名称不可以包含 \/:?*"<>|
                            dir = dir.replace(/[\\\/:?*"<>|]/ig, '-')
                            let infos = await Bangumi.part({ dir, id, part, episode })
                            // 页面列表
                            exporterTypes.push('此集')
                            exporterTypes.push(Exporter.IDM(infos))
                            exporterTypes.push(Exporter.Aria2(infos))
                            exporterTypes.push(Exporter.Aria2RPC(infos))
                            exporterTypes.push({})
                            // 全集
                            let epList = window.__INITIAL_STATE__.epList
                            infos = await Bangumi.allPart({ dir, epList })
                            console.log(infos)
                            exporterTypes.push('全集')
                            exporterTypes.push(Exporter.IDM(infos))
                            exporterTypes.push(Exporter.Aria2(infos))
                            exporterTypes.push(Exporter.Aria2RPC(infos))
                            Exporter.list(exporterTypes)
                        } else {
                            setTimeout(epStatus, 500)
                        }
                    }
                    setTimeout(epStatus, 500)
                }
            }
        }
    }

    class Exporter {
        static IDM(infos) {
            let data = []
            infos.map(info => info.map(pages => pages.map(page => {
                let { url } = page
                data.push(`<\r\n${url}\r\nreferer: ${REFERER}\r\n>\r\n`)
            })))
            return {
                textContent: 'IDM',
                download: 'download.ef2',
                href: URL.createObjectURL(new Blob([data.join('')]))
            }
        }
        static Aria2(infos) {
            let data = []
            infos.map(info => info.map(pages => pages.map(page => {
                let { dir, url, out } = page
                data.push(`${url}\r\n referer=${REFERER}\r\n dir=${BASEDIR}${dir}\r\n out=${out}.FLV\r\n`)
            })))
            return {
                textContent: 'Aria2',
                download: 'download.session',
                href: URL.createObjectURL(new Blob([data.join('')]))
            }
        }
        static Aria2RPC(infos) {
            return {
                textContent: 'Aria2RPC',
                href: '',
                onclick: function () {
                    infos.map(info => info.map(pages => pages.map(page => {
                        let rpcStatus = document.getElementById('rpcStatus')
                            , { dir, out, url } = page

                        let xhr = new XMLHttpRequest()
                        xhr.onloadstart = e => {
                            rpcStatus.innerHTML = '<p>发送请求</p>'
                        }
                        xhr.onload = e => {
                            rpcStatus.innerHTML = '<p>请求完成</p>'
                        }
                        xhr.onerror = e => {
                            rpcStatus.innerHTML = `<p>请求出错:${e}</p>`
                            console.log(e)
                        }
                        xhr.ontimeout = e => {
                            rpcStatus.innerHTML += '<p>请求超时</p>'
                        }
                        xhr.open('POST', `${ARIA2RPC}`, true);
                        xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8')
                        xhr.send(JSON.stringify([{
                            id: '',
                            jsonrpc: 2,
                            method: "aria2.addUri",
                            params: [
                                `token:${ARIA2TOKEN}`,
                                [url],
                                { 'referer': `${REFERER}`, 'out': `${BASEDIR}${out}.FLV`, 'dir': `${dir}` }
                            ]
                        }]))
                    })))
                }
            }
        }
        static list(types) {
            let dd = document.createElement('div')
            dd.style.backgroundColor = '#00A1D6'
            dd.style.zIndex = 999
            dd.style.position = 'fixed'
            dd.style.width = '76px'
            dd.style.fontSize = '1.2em'
            dd.textContent = '下载方式'
            dd.style.top = '70px'

            let rpcStatus = document.createElement('p')
            rpcStatus.id = 'rpcStatus'
            rpcStatus.style.color = 'red'
            dd.appendChild(rpcStatus)
            for (let i of types) {
                dd.appendChild(createA(i))
            }
            dd.appendChild(createA({}))
            dd.appendChild(createA({ textContent: '帮助', href: 'https://github.com/evgo2017/bilibili_vedio_download' }))
            let wait = () => {
                if (document.body) {
                    document.body.appendChild(dd)
                } else {
                    setTimeout(wait, 1000)
                }
            }
            setTimeout(wait, 1000)
            function createA(goal) {
                let { textContent, download, href, onclick } = goal
                let a = document.createElement('a')
                a.style.display = 'block'
                a.style.fontSize = '1em'
                a.style.padding = '5px'

                if (typeof goal == 'string') {
                    a.textContent = goal
                    return a
                }
                if (textContent) {
                    a.style.color = '#fff'
                    a.textContent = textContent ? textContent : '-----'
                } else {
                    a.style.color = '#000'
                    a.textContent = '-----'
                }
                if (href) a.href = href
                if (download) a.download = download
                if (onclick) a.onclick = onclick
                return a
            }
        }
    }
    Info.get()
})()
