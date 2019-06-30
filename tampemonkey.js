// ==UserScript==
// @name        bilibili_vedio_download
// @namespace   http://evgo2017.com/
// @homepageURL https://github.com/evgo2017/bilibili_vedio_download
// @supportURL  https://github.com/evgo2017/bilibili_vedio_download/issues
// @description bilibili/哔哩哔哩视频/番剧下载，目前仅支持单个（当前页）视频下载，支持大会员视频下载（需要用户本身是大会员），IDM，Aria2，Aria2RPC 导出方式。详细内容请在 Github 查看。参考资料：https://github.com/Xmader/bilitwin/ && https://github.com/blogwy/BilibiliVideoDownload
// @match       *://www.bilibili.com/video/av*
// @match       *://www.bilibili.com/bangumi/play/ep*
// @match       *://space.bilibili.com/*/favlist*
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

    let TITLE = null, URLS = [], rpcStatus

    class Exporter {
        static IDM() {
            return {
                textContent: 'IDM',
                download: 'download.ef2',
                href: URL.createObjectURL(new Blob([URLS.map(url => `<\r\n${url}\r\nreferer: ${REFERER}\r\n>\r\n`).join('')]))
            }
        }
        static Aria2() {
            return {
                textContent: 'Aria2',
                download: 'download.session',
                href: URL.createObjectURL(new Blob([URLS.map((url, index) => {
                    let out = URLS.length < 2 ? TITLE : TITLE + '-' + index
                    return `${url}\r\n referer=${REFERER}\r\n out=${out}.FLV\r\n`
                }).join('')]))
            }
        }
        static Aria2RPC() {
            return {
                textContent: 'Aria2RPC',
                href: '',
                onclick: function () {
                    URLS.map((url, index) => {
                        let out = URLS.length < 2 ? `${TITLE}` : `${TITLE}-${index}`
                            , dir = `${BASEDIR}${TITLE}`
                            , rpcStatus = document.getElementById('rpcStatus')

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
                                { 'referer': `${REFERER}`, 'out': `${out}.FLV`, 'dir': `${dir}` }
                            ]
                        }]))
                    })
                }
            }
        }
    }

    class Info {
        static Vedio() {
            let inital = window.__INITIAL_STATE__
                , { aid, p, videoData } = inital
            p = p ? parseInt(p) - 1 : 0

            let { cid } = videoData.pages[p]

            let xhr = new XMLHttpRequest()
            xhr.withCredentials = true
            xhr.open('GET', `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`, false)
            xhr.send()

            let durl = JSON.parse(xhr.responseText).data.durl
            if (durl.length < 2) {
                // 无分段
                return [durl[0].url]
            } else {
                // 有分段
                return durl.map(value => value.url)
            }
        }

        static Bangumi() {
            let { id, longTitle } = window.__INITIAL_STATE__.epInfo

            let xhr = new XMLHttpRequest()
            xhr.withCredentials = true
            xhr.open('GET', `https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`, false)
            xhr.send()

            let durl = JSON.parse(xhr.responseText).result.durl
            if (durl.length < 2) {
                return [durl[0].url]
            } else {
                return durl.map(value => value.url)
            }
        }

        static async Vedio(av) {
            let xhr = new XMLHttpRequest()
            xhr.withCredentials = true
            xhr.open('GET', `https://api.bilibili.com/x/web-interface/view?aid=${av}`, false)
            xhr.send()
            const { aid, title, pages } = JSON.parse(xhr.responseText).data

            return Promise.all(pages.map(async page => {
                const { cid } = page
                    , dir = pages.length > 1 ? title : ''

                xhr.open('GET', `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${QN}&otype=json`, false)
                xhr.send()
                let downloadInfo = JSON.parse(xhr.responseText)

                let durl = downloadInfo.data ? downloadInfo.data.durl : downloadInfo.durl
                if (durl.length < 2) {
                    return [durl[0].url]
                } else {
                    return durl.map(value => value.url)
                }
            }))
        }
    }

    function createA(goal) {
        let { textContent, download, href, onclick } = goal
        let a = document.createElement('a')
        a.style.display = 'block'
        a.style.fontSize = '1.2em'
        a.style.color = '#fff'
        a.style.padding = '5px'

        a.textContent = textContent
        if (href) a.href = href
        if (download) a.download = download
        if (onclick) a.onclick = onclick
        return a
    }

    let download = function () {
        if (document.querySelector('#viewbox_report') || document.querySelector('.media-wrapper')) {
            TITLE = document.querySelector('#viewbox_report h1') ? document.querySelector('#viewbox_report h1').title : document.querySelector('.media-wrapper h1').title
            // 文件夹名称不可以包含 \/:?*"<>|
            TITLE = TITLE.replace(/[\\\/:?*"<>|]/ig, '-')

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
            let exporterType = [Exporter.IDM(), Exporter.Aria2(), Exporter.Aria2RPC()]
            for (let i of exporterType) {
                dd.appendChild(createA(i))
            }
            dd.appendChild(createA({ textContent: '帮助', href: 'https://github.com/evgo2017/bilibili_vedio_download' }))
            document.body.appendChild(dd)
        } else {
            setTimeout(download, 1000)
        }
    }

    // @match       *://www.bilibili.com/video/av*
    // @match       *://www.bilibili.com/bangumi/play/ep*
    // @match       *://space.bilibili.com/*/favlist*
    let currentURL = window.location.href
    if (currentURL.search('bangumi') > -1) {
        let epStatus = function () {
            if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.epStatus >= 2) {
                URLS = Info.Bangumi()
                setTimeout(download, 1000)
            } else {
                setTimeout(epStatus, 1000)
            }
        }
        setTimeout(epStatus, 1000)
    } else if (currentURL.search('video') > -1) {
        let avState = function () {
            if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData.pages) {
                URLS = Info.Vedio()
                setTimeout(download, 1000)
            } else {
                setTimeout(avState, 1000)
            }
        }
        setTimeout(avState, 1000)
    } else if (currentURL.search('favlist') > -1) {
        const up_mid = /\d+/.exec(currentURL)[0]

        let xhr = new XMLHttpRequest()
        xhr.withCredentials = true;
        xhr.open('GET', `https://api.bilibili.com/medialist/gateway/base/created?pn=1&ps=100&up_mid=${up_mid}&is_space=0&jsonp=jsonp`, false)
        xhr.send()

        const favlists = JSON.parse(xhr.responseText).data.list

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

        let maxPn = media_count / 20 + 1, mediaIDs = []
        for (let pn = 1; pn < maxPn; pn++) {
            xhr.open('GET', `https://api.bilibili.com/medialist/gateway/base/spaceDetail?media_id=${media_id}&ps=20&pn=${pn}&keyword=&order=mtime&type=0&tid=0&jsonp=jsonp`, false)
            xhr.send()
            let medias = JSON.parse(xhr.responseText).data.medias
            for (let media of medias) {
                mediaIDs.push(media.id)
            }
        }

        Promise.all(mediaIDs.map(async av => {
            await Info.Vedio(av)
        }))
    }
})()
