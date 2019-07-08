// ==UserScript==
// @name        bilibili_video_download
// @namespace   http://evgo2017.com/
// @homepageURL https://github.com/evgo2017/bilibili_video_download
// @supportURL  https://github.com/evgo2017/bilibili_video_download/issues
// @description bilibili/哔哩哔哩视频/番剧下载，单/多P下载，单/多集下载，多视频/番剧正片下载，大会员（本身是），IDM，Aria2，Aria2RPC 导出方式，Local Storage 方式保存配置。详细内容请在 Github 查看。参考资料：https://github.com/Xmader/bilitwin/ && https://github.com/blogwy/BilibiliVideoDownload
// @match       *://www.bilibili.com/video/av*
// @match       *://www.bilibili.com/bangumi/play/ep*
// @match       *://www.bilibili.com/bangumi/play/ss*
// @match       *://space.bilibili.com/*/favlist*
// @match       *://space.bilibili.com/*/bangumi*
// @match       *://space.bilibili.com/*/cinema*
// @version     1.1.1
// @license     MIT License
// @author      evgo2017
// @copyright   evgo2017
// @grant       none
// @run-at      document-body
// ==/UserScript==

(async function () {
    'use strict';
    /**
     * 用户配置
     */
    const LocalStorageName = 'evgoBvd'
    const defaultOptions = new Map([
        ['BASEDIR', './']
        , ['ARIA2TOKEN', '']
        , ['ARIA2RPC', 'http://localhost:6800/jsonrpc']
        , ['QN', '120']
    ])
    if (!localStorage.getItem(LocalStorageName)) {
        let evgoBvd = {}
        for (let [key, value] of defaultOptions) {
            evgoBvd[key] = value
        }
        localStorage.setItem(LocalStorageName, JSON.stringify(evgoBvd))
    }

    let BASEDIR, ARIA2TOKEN, ARIA2RPC, QN
    function refreshOptions() {
        let evgoBvd = JSON.parse(localStorage.getItem(LocalStorageName))
        BASEDIR = evgoBvd.BASEDIR
        ARIA2TOKEN = evgoBvd.ARIA2TOKEN
        ARIA2RPC = evgoBvd.ARIA2RPC
        QN = evgoBvd.QN
    }
    refreshOptions()

    const REFERER = 'https://www.bilibili.com'
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
    /**
     * 单集 Part QN 以播放器的 QN 为准，其余以设置的 QN 为准
     */
    const changePartQN = setInterval(() => {
        let lis = document.querySelectorAll('.bilibili-player-video-quality-menu .bui-select-item')
        if (lis.length) {
            clearInterval(changePartQN)
            lis.forEach(li => {
                li.addEventListener('click', () => {
                    Info.get()
                })
            })
        }
    }, 500)
    /**
     * 直到 condition 条件成立返回
     * @param {function} condition 
     */
    const waitFor = async function (condition) {
        let res = await new Promise(resolve => {
            const wait = setInterval(() => {
                if (condition()) {
                    clearInterval(wait)
                    resolve('ok')
                }
            }, 100)
        })
        return res
    }
    /**
     * 设置 Cookies
     * @param {string} name 
     * @param {string} value 
     */
    function setCookie(name, value) {
        let date = new Date()
        date.setTime(date.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
        document.cookie = name + "=" + escape(value) + ";path=/;" + 'expires=' + date.toGMTString() + ';'
    }
    /**
     * 得到 Cookies
     * @param {string} name 
     */
    function getCookie(name) {
        let arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)")
        return (arr = document.cookie.match(reg)) ? unescape(arr[2]) : null
    }
    /**
     * 设置 Local Storage
     * @param {string} name 
     * @param {string} value 
     */
    function setLocalStorage(name, value) {
        let evgoBvd = JSON.parse(localStorage.getItem(LocalStorageName))
        evgoBvd[name] = value
        localStorage.setItem(LocalStorageName, JSON.stringify(evgoBvd))
    }
    /**
     * 得到 Local Storage
     * @param {string} name 
     */
    function getLocalStorage(name) {
        let evgoBvd = JSON.parse(localStorage.getItem(LocalStorageName))
        return evgoBvd.hasOwnProperty(name) ? evgoBvd[name] : null
    }

    class Video {
        /**
         * 获取 video 视频的某 Part
         * @param { dir, id, cid, part, pic } video
         */
        static async part(video) {
            const QN = getCookie('CURRENT_QUALITY')
                , { dir, id: aid, cid, part, pic } = video
                , res = await rp(`https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`)
                , durl = JSON.parse(res).data.durl

            let urls = [{ dir, out: `${part}.${pic.split('.').pop()}`, url: pic }]
            if (durl.length < 2) {
                // 无分段
                urls.push({ dir, out: `${part}.FLV`, url: durl[0].url })
            } else {
                // 有分段
                durl.forEach((value, index) => {
                    urls.push({ dir, out: `${part}-${index}.FLV`, url: value.url })
                })
            }
            return [[urls]]
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
                    , { pages, pic } = JSON.parse(res).data

                return Promise.all(pages.map(async page => {
                    const { cid, part } = page
                        , res = await rp(`https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`)
                        , durl = JSON.parse(res).data.durl

                    let urls = [{ dir, out: `${part}.${pic.split('.').pop()}`, url: pic }]
                    if (durl.length < 2) {
                        // 无分段
                        urls.push({ dir, out: `${part}.FLV`, url: durl[0].url })
                    } else {
                        // 有分段
                        durl.forEach((value, index) => {
                            urls.push({ dir, out: `${part}-${index}.FLV`, url: value.url })
                        })
                    }
                    return urls
                }))
            }))
        }
    }
    class Bangumi {
        /**
         * 获取 bangumi 的某集
         * @param { dir, id, part, episode, cover } bangumi
         */
        static async part(bangumi) {
            const QN = getCookie('CURRENT_QUALITY')
                , { dir, id, part, episode, cover } = bangumi
                , res = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)
                , durl = JSON.parse(res).result.durl

            let urls = [{ dir, out: `第${episode}集-${part}.${cover.split('.').pop()}`, url: cover }]
            if (durl.length < 2) {
                // 无分段
                urls.push({ dir, out: `第${episode}集-${part}.FLV`, url: durl[0].url })
            } else {
                // 有分段
                durl.forEach((value, index) => {
                    urls.push({ dir, out: `第${episode}集-${part}-${index}.FLV`, url: value.url })
                })
            }
            return [[urls]]
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

                return Promise.all(epList.map(async page => {
                    const { id, title: episode, cover } = page
                        , part = page.longTitle ? page.longTitle : page.long_title
                        , res = await rp(`https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`)
                        , durl = JSON.parse(res).result.durl

                    let urls = [{ dir, out: `第${episode}集-${part}.${cover.split('.').pop()}`, url: cover }]
                    if (durl.length < 2) {
                        // 无分段
                        urls.push({ dir, out: `第${episode}集-${part}.FLV`, url: durl[0].url })
                    } else {
                        // 有分段
                        durl.forEach((value, index) => {
                            urls.push({ dir, out: `第${episode}集-${part}-${index}.FLV`, url: value.url })
                        })
                    }
                    return urls
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
                    Info.oneVideo()
                } else if (currentURL.search('bangumi') > -1) {
                    // 番剧 @match *://www.bilibili.com/bangumi/play/ep*
                    Info.oneBangumi()
                }
            }
        }
        static async oneVideo() {
            await waitFor(() => window.__INITIAL_STATE__)
            await waitFor(() => window.__INITIAL_STATE__.videoData)
            await waitFor(() => window.__INITIAL_STATE__.videoData.pages)
            await waitFor(() => document.querySelector('#viewbox_report h1'))

            const { aid, videoData } = window.__INITIAL_STATE__
                , pic = `https:${videoData.pic}`
                , p = getParameter('p') ? getParameter('p') - 1 : 0
                , { cid, part } = videoData.pages[p]
                , dir = document.querySelector('#viewbox_report h1').title.replace(/[\\\/:?*"<>|]/ig, '-')

            // 功能列表
            // 当前 Part
            let infos = [], exporterTypes = []
            infos = await Video.part({ dir, id: aid, cid, part: part ? part : dir, pic })
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
        }
        static async oneBangumi() {
            await waitFor(() => window.__INITIAL_STATE__)
            await waitFor(() => parseInt(window.__INITIAL_STATE__.epInfo.epStatus) > 0)
            await waitFor(() => document.querySelector('.media-title'))
            await waitFor(() => window.__INITIAL_STATE__.epList)

            const { id, title: episode, longTitle: part } = window.__INITIAL_STATE__.epInfo
                , cover = `https:${window.__INITIAL_STATE__.epInfo.cover}`
                , dir = document.querySelector('.media-title').title.replace(/[\\\/:?*"<>|]/ig, '-')
                , epList = window.__INITIAL_STATE__.epList

            // 功能列表
            // 单集
            let infos = [], exporterTypes = []
            infos = await Bangumi.part({ dir, id, part: part ? part : dir, episode, cover })
            exporterTypes.push('此集')
            exporterTypes.push(Exporter.IDM(infos))
            exporterTypes.push(Exporter.Aria2(infos))
            exporterTypes.push(Exporter.Aria2RPC(infos))
            exporterTypes.push({})
            // 全集
            infos = await Bangumi.all({ dir, epList })
            exporterTypes.push('全集')
            exporterTypes.push(Exporter.IDM(infos))
            exporterTypes.push(Exporter.Aria2(infos))
            exporterTypes.push(Exporter.Aria2RPC(infos))
            Exporter.list(exporterTypes)
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
                data.push(`${url}\r\n referer=${REFERER}\r\n dir=${BASEDIR}${dir}\r\n out=${out}\r\n`)
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
                        xhr.open('POST', `${ARIA2RPC}`, true)
                        xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8')
                        xhr.send(JSON.stringify([{
                            id: '',
                            jsonrpc: 2,
                            method: "aria2.addUri",
                            params: [
                                `token:${ARIA2TOKEN}`,
                                [url],
                                { 'referer': `${REFERER}`, 'dir': `${BASEDIR}${dir}`, 'out': `${out}` }
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
            Exporter.list([{ textContent: '获取数据', onclick: func }])
        }
        /**
         * 功能列表
         * @param {Array} types
         */
        static list(types) {
            if (document.getElementById('bvdlist')) {
                document.body.removeChild(document.getElementById('bvdlist'))
            }
            let dd = document.createElement('div')
            dd.id = 'bvdlist'
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
            dd.appendChild(createA({
                textContent: '设置', onclick: function () {
                    let st = document.getElementById('bvdsetting')
                    if (st) {
                        st.style.display = st.style.display == 'none' ? 'block' : 'none'
                    } else {
                        setting()
                    }
                }
            }))
            dd.appendChild(createA({ textContent: '帮助', href: 'https://github.com/evgo2017/bilibili_video_download' }))
            document.body.appendChild(dd)

            /**
            * 设置用户配置
            */
            function setting() {
                let st = document.createElement('div')
                    , meta = document.createElement('p')
                st.id = 'bvdsetting'
                st.style.backgroundColor = '#00A1D6'
                st.style.zIndex = 999
                st.style.position = 'fixed'
                st.style.padding = '10px'
                st.style.fontSize = '1.2em'
                st.textContent = '设置'
                st.style.top = '70px'
                st.style.left = '80px'

                const inputs = [
                    { textContent: `基础路径（以 “/\” 结尾）`, name: 'BASEDIR' }
                    , { textContent: 'ARIA2TOKEN', name: 'ARIA2TOKEN' }
                    , { textContent: 'ARIA2RPC', name: 'ARIA2RPC' }
                    , { textContent: '清晰度（默认最高）', name: 'QN' }
                ]
                for (let i of inputs) {
                    st.appendChild(createInput(i))
                }

                meta.style.color = 'red'
                meta.innerHTML = '修改即生效'
                st.appendChild(meta)
                document.body.appendChild(st)
            }
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
            /**
             * 创建修改标签
             */
            function createInput(goal) {
                const { textContent, name } = goal
                let value = getLocalStorage(name)
                    , div = document.createElement('div')
                    , label = document.createElement('label')
                    , input = document.createElement('input')

                label.setAttribute("for", name)
                label.innerHTML = `${textContent}:`
                label.style.display = 'inline-block'
                label.style.marginBottom = '5px'

                input.style.display = 'block'
                input.style.fontSize = '1em'
                input.style.border = 0
                input.style.padding = '5px'
                input.placeholder = value
                input.value = value
                input.name = name
                input.onblur = function () {
                    setLocalStorage(name, input.value)
                    refreshOptions()
                    Info.get()
                }

                div.style.marginTop = '15px'
                div.style.marginBottom = '10px'

                div.appendChild(label)
                div.appendChild(input)
                return div
            }
        }
    }
    Info.get()
})()
