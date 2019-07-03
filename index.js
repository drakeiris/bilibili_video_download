// ==UserScript==
// @name        bilibili_video_download
// @namespace   http://evgo2017.com/
// @homepageURL https://github.com/evgo2017/bilibili_video_download
// @supportURL  https://github.com/evgo2017/bilibili_video_download/issues
// @description bilibili/哔哩哔哩视频/番剧下载，单/多P下载，单/多集下载，多视频/番剧正片下载，大会员（本身是），IDM，Aria2，Aria2RPC 导出方式。详细内容请在 Github 查看。参考资料：https://github.com/Xmader/bilitwin/ && https://github.com/blogwy/BilibiliVideoDownload
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
        , BASEDIR = './' // 末尾一定要有 '/'，根据自己需求更改此基础地址
        , ARIA2RPC = 'http://localhost:6800/jsonrpc'
        , ARIA2TOKEN = '' // Aria2 Secret Token
        , QN = 116

    /**
     * 获取 api 数据
     * @param {string} url 
     */
    function rp(url) {
        let xhr = new XMLHttpRequest()
        xhr.withCredentials = true
        xhr.open('GET', url, false)
        xhr.send()
        return xhr.responseText
    }
    /**
     * 获取 url 中的参数
     * @param {string} param 
     */
    function getParameter(param) {
        let reg = new RegExp(param + "=([^\&]*)", "i")
            , res = reg.exec(window.location.search)
        if (res == null) return null
        return parseInt(res[1])
    }
    /**
     * 监听 history，无需刷新页面即可更新功能列表
     * @param {string} type 
     */
    /*https://stackoverflow.com/questions/4570093/how-to-get-notified-about-changes-of-the-history-via-history-pushstate*/
    const _wr = function (type) {
        var orig = history[type]
        return function () {
            var rv = orig.apply(this, arguments)
            var e = new Event(type)
            e.arguments = arguments
            window.dispatchEvent(e)
            return rv
        }
    }
    history.pushState = _wr('pushState')
    history.replaceState = _wr('replaceState')
    window.addEventListener('replaceState', () => { Info.get() })
    window.addEventListener('pushState', () => { Info.get() })

    class Video {
        /**
         * 获取 video 视频的某 Part
         * @param { dir, id, cid, part } video 
         */
        static async part(video) {
            const { dir, id: aid, cid, part } = video
                , res = await rp(`https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`)
                , durl = JSON.parse(res).data.durl

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
        /**
         * 获取 videos 的所有 video 的全部 Part
         * @param [{ dir, id },{ dir, id }] / { dir, id } videos 
         */
        static async all(videos) {
            if (!Array.isArray(videos)) {
                videos = [videos]
            }
            return Promise.all(videos.map(async video => {
                const { dir, id: aid } = video
                    , res = await rp(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`)
                    , { pages } = JSON.parse(res).data

                return Promise.all(pages.map(async page => {
                    const { cid, part } = page
                        , res = await rp(`https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`)
                        , durl = JSON.parse(res).data.durl

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
            }))
        }
    }
    class Bangumi {
        /**
         * 获取 bangumi 的某集
         * @param { dir, id, part, episode } bangumi 
         */
        static async part(bangumi) {
            const { dir, id, part, episode } = bangumi
                , res = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)
                , durl = JSON.parse(res).result.durl

            if (durl.length < 2) {
                return [[[{ dir, part, out: `第${episode}集-${part}`, url: durl[0].url }]]]
            } else {
                return [[durl.map((value, index) => {
                    return { dir, part, out: `第${episode}集-${part}-${index}`, url: value.url }
                })]]
            }
        }
        /**
         * 获取 bangumis 的所有 bangumi 的全集正片
         * @param [{ dir, epList },{ dir, epList }] / { dir, epList } bangumis 
         */
        static async all(bangumis) {
            if (!Array.isArray(bangumis)) {
                bangumis = [bangumis]
            }
            return Promise.all(bangumis.map(async bangumi => {
                const { dir, id } = bangumi
                let { epList } = bangumi
                if (!epList) {
                    let res = await rp(`https://api.bilibili.com/pgc/web/season/section?season_id=${id}`)
                    if (JSON.parse(res).result.main_section) {
                        epList = JSON.parse(res).result.main_section.episodes
                    } else {
                        epList = []
                    }
                }

                return Promise.all(epList.map(async (page, index) => {
                    const { id, title: episode } = page
                        , part = page.longTitle ? page.longTitle : page.long_title
                        , res = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)
                        , durl = JSON.parse(res).result.durl

                    if (durl.length < 2) {
                        return [{ dir, part, out: `第${episode}集-${part}`, url: durl[0].url }]
                    } else {
                        return durl.map((value, index) => {
                            return { dir, part, out: `第${episode}集-${part}-${index}`, url: value.url }
                        })
                    }
                }))
            }))
        }
    }
    class Info {
        /**
         * 获取当前页面的对应功能列表
         */
        static async get() {
            const currentURL = window.location.href
            if (currentURL.search('space') > -1) {
                // 批量
                if (currentURL.search('favlist') > -1) {
                    // 收藏页 @match *://space.bilibili.com/*/favlist*
                    Exporter.getData(Info.favlist)
                } else if (currentURL.search('bangumi') > -1 || currentURL.search('cinema') > -1) {
                    // 追番 @match *://space.bilibili.com/*/bangumi*
                    // 追剧 @match *://space.bilibili.com/*/cinema*
                    Exporter.getData(Info.bangumisOrCinema)
                }
            } else {
                // 单个
                if (currentURL.search('video') > -1) {
                    // 视频 @match *://www.bilibili.com/video/av*
                    let avState = async function () {
                        // 单/全 Part
                        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData && window.__INITIAL_STATE__.videoData.pages) {
                            const { aid, videoData } = window.__INITIAL_STATE__
                                , p = getParameter('p') ? getParameter('p') - 1 : 0
                                , { cid, part } = videoData.pages[p]
                            let dir = document.querySelector('#viewbox_report h1').title
                                , infos = []
                                , exporterTypes = []
                            // 文件夹名称不可以包含 \/:?*"<>|
                            dir = dir.replace(/[\\\/:?*"<>|]/ig, '-')

                            // 功能列表
                            // 当前 Part
                            infos = await Video.part({ dir, id: aid, cid, part: part ? part : dir })
                            exporterTypes.push('此 Part')
                            exporterTypes.push(Exporter.IDM(infos))
                            exporterTypes.push(Exporter.Aria2(infos))
                            exporterTypes.push(Exporter.Aria2RPC(infos))
                            exporterTypes.push({})
                            // 全 Part
                            infos = await Video.all({ dir, id: aid })
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
                    // 番剧 @match *://www.bilibili.com/bangumi/play/ep*
                    let epStatus = async function () {
                        // 单/全集
                        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.id > -1 && window.__INITIAL_STATE__.epList) {
                            const { id, title: episode, longTitle: part } = window.__INITIAL_STATE__.epInfo
                            let dir = document.querySelector('.media-title').title
                                , infos = []
                                , exporterTypes = []
                                , epList
                            // 文件夹名称不可以包含 \/:?*"<>|
                            dir = dir.replace(/[\\\/:?*"<>|]/ig, '-')

                            // 功能列表
                            // 单集
                            infos = await Bangumi.part({ dir, id, part: part ? part : dir, episode })
                            exporterTypes.push('此集')
                            exporterTypes.push(Exporter.IDM(infos))
                            exporterTypes.push(Exporter.Aria2(infos))
                            exporterTypes.push(Exporter.Aria2RPC(infos))
                            exporterTypes.push({})
                            // 全集
                            epList = window.__INITIAL_STATE__.epList
                            infos = await Bangumi.all({ dir, epList })
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
        /**
         * 获取收藏页数据
         */
        static async favlist() {
            // 收藏页 @match *://space.bilibili.com/*/favlist*
            const up_mid = /\d+/.exec(window.location.href)[0]
                , res = await rp(`https://api.bilibili.com/medialist/gateway/base/created?pn=1&ps=100&up_mid=${up_mid}&is_space=0&jsonp=jsonp`)
                , favlists = JSON.parse(res).data.list
            let media_id
                , media_count
                , maxPn
                , infos = []
                , infoss = []
                , exporterTypes = []

            if (window.location.search) {
                media_id = getParameter('fid')
                for (let fav of favlists) {
                    if (media_id == fav.id) {
                        media_count = fav.media_count
                    }
                }
            } else {
                media_id = favlists[0].id
                media_count = favlists[0].media_count
            }

            maxPn = media_count / 20 + 1
            for (let pn = 1; pn < maxPn; pn++) {
                const res = await rp(`https://api.bilibili.com/medialist/gateway/base/spaceDetail?media_id=${media_id}&ps=20&pn=${pn}&keyword=&order=mtime&type=0&tid=0&jsonp=jsonp`)
                    , medias = JSON.parse(res).data.medias
                for (let media of medias) {
                    let { title: dir, id } = media
                    infos.push({ dir, id })
                }
            }

            // 功能列表
            infoss = await Video.all(infos)
            exporterTypes.push('当前收藏夹')
            exporterTypes.push(Exporter.IDM(infoss))
            exporterTypes.push(Exporter.Aria2(infoss))
            exporterTypes.push(Exporter.Aria2RPC(infoss))
            Exporter.list(exporterTypes)
        }
        /**
         * 获取追番/剧数据
         */
        static async bangumisOrCinema() {
            // 追番 @match *://space.bilibili.com/*/banguimi*
            // 追剧 @match *://space.bilibili.com/*/cinema*
            const up_mid = /\d+/.exec(window.location.href)[0]
                , type = window.location.href.search('bangumi') > -1 ? 1 : 2
                , ts = Date.parse(new Date())
                , res = await rp(`https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=1&ps=15&vmid=${up_mid}&ts=${ts}`)
                , { list: bangumis, ps, total } = JSON.parse(res).data
            let maxPn
                , infos = []
                , infoss = []
                , exporterTypes = []

            bangumis.forEach(bangumi => {
                let { title: dir, season_id: id } = bangumi
                infos.push({ dir, id })
            })

            maxPn = total / ps + 1
            for (let pn = 2; pn <= maxPn; pn++) {
                // 说明有多页，需要多次获取
                const res = await rp(`https://api.bilibili.com/x/space/bangumi/follow/list?type=${type}&follow_status=0&pn=${pn}&ps=15&vmid=${up_mid}&ts=${ts}`)
                    , { list: bangumis } = JSON.parse(res).data
                bangumis.forEach(bangumi => {
                    let { title: dir, season_id: id } = bangumi
                    infos.push({ dir, id })
                })
            }

            // 功能列表
            infoss = await Bangumi.all(infos)
            exporterTypes.push('追剧')
            exporterTypes.push(Exporter.IDM(infoss))
            exporterTypes.push(Exporter.Aria2(infoss))
            exporterTypes.push(Exporter.Aria2RPC(infoss))
            Exporter.list(exporterTypes)
        }
    }

    class Exporter {
        /**
         * 以 IDM 方式导出
         * @param {Array} infos 
         */
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
        /**
         * 以 Aria2 方式导出
         * @param {Array} infos 
         */
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
        /**
         * 将数据发送到 Aria2RPC
         * @param {Array} infos 
         */
        static Aria2RPC(infos) {
            return {
                textContent: 'Aria2RPC',
                href: '',
                onclick: function () {
                    infos.map(info => info.map(pages => pages.map(page => {
                        let { dir, out, url } = page
                            , rpcStatus = document.getElementById('rpcStatus')
                            , xhr = new XMLHttpRequest()

                        xhr.onloadstart = () => {
                            rpcStatus.innerHTML = '<p>发送请求</p>'
                        }
                        xhr.onload = () => {
                            rpcStatus.innerHTML = '<p>请求完成</p>'
                        }
                        xhr.onerror = (e) => {
                            rpcStatus.innerHTML = `<p>请求出错:${e}</p>`
                        }
                        xhr.ontimeout = () => {
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
        /**
         * 点击按钮再获取数据
         * @param {function} func 
         */
        static getData(func) {
            Exporter.list([{
                textContent: '获取数据',
                onclick: func
            }])
        }
        /**
         * 功能列表
         * @param {Array} types 
         */
        static list(types) {
            let wait = () => {
                if (document.body) {
                    if (document.getElementById('bvdlist')) {
                        document.body.removeChild(document.getElementById('bvdlist'))
                    }
                    let dd = document.createElement('div')
                    dd.style.backgroundColor = '#00A1D6'
                    dd.style.zIndex = 999
                    dd.style.position = 'fixed'
                    dd.style.width = '76px'
                    dd.style.fontSize = '1.2em'
                    dd.textContent = '下载方式'
                    dd.style.top = '70px'
                    dd.id = 'bvdlist'

                    let rpcStatus = document.createElement('p')
                    rpcStatus.id = 'rpcStatus'
                    rpcStatus.style.color = 'red'
                    dd.appendChild(rpcStatus)

                    for (let i of types) {
                        dd.appendChild(createA(i))
                    }
                    dd.appendChild(createA({}))
                    dd.appendChild(createA({ textContent: '帮助', href: 'https://github.com/evgo2017/bilibili_video_download' }))
                    document.body.appendChild(dd)
                } else {
                    setTimeout(wait, 1000)
                }
            }
            setTimeout(wait, 1000)

            /**
             * 创建按钮 dom
             * @param {object} goal 
             */
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
