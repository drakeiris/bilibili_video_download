// ==UserScript==
// @name        bilibili_vedio_download
// @namespace   http://evgo2017.com/
// @homepageURL https://github.com/evgo2017/bilibili_vedio_download
// @supportURL  https://github.com/evgo2017/bilibili_vedio_download/issues
// @description bilibili/哔哩哔哩视频/番剧下载，目前仅支持单个（当前页）视频下载，支持大会员视频下载（需要用户本身是大会员），IDM，Aria2，Aria2RPC 导出方式。详细内容请在 Github 查看。参考资料：https://github.com/Xmader/bilitwin/ && https://github.com/blogwy/BilibiliVideoDownload
// @match       *://www.bilibili.com/video/av*
// @match       *://www.bilibili.com/bangumi/play/ep*
// @version     1.0.0
// @license     MIT License
// @author      evgo2017
// @copyright   evgo2017
// @grant       none
// @run-at      document-start
// ==/UserScript==
(async function() {
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
                    let out = URLS.length<2 ? TITLE : TITLE +'-' + index
                    return `${url}\r\n referer=${REFERER}\r\n out=${out}.FLV\r\n`
                }).join('')]))
            }
        }
        static Aria2RPC() {
            return {
                textContent: 'Aria2RPC',
                href: '',
                onclick: function(){
                    URLS.map((url, index) => {
                        let out, dir
                        if(URLS.length<2){
                            out = `${TITLE}`
                            dir = `${BASEDIR}${TITLE}`
                        } else {
                            out = `${TITLE}-${index}`
                            dir = `${BASEDIR}${TITLE}`
                        }
                        let rpcStatus = document.getElementById('rpcStatus')
                        let xhr = new XMLHttpRequest()
                        xhr.onloadstart = e => {
                            rpcStatus.innerHTML='<p>发送请求</p>'
                        }
                        xhr.onload = e => {
                            rpcStatus.innerHTML='<p>请求完成</p>'
                        }
                        xhr.onerror = e => {
                            rpcStatus.innerHTML=`<p>请求出错:${e}</p>`
                        }
                        xhr.ontimeout = e => {
                            //rpcStatus = '<p>请求超时</p>'
                            rpcStatus.innerHTML+='<p>请求超时</p>'
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
                                { 'referer': `${REFERER}`, 'out': `${out}.FLV`, 'dir': `${dir}`}
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
            ,{ aid, p, videoData } = inital
            p = p? parseInt(p)-1 : 0

            let { cid, part } = videoData.pages[p]
            part = part ? TITLE + '-' +part : TITLE

            let xhr = new XMLHttpRequest()
            xhr.withCredentials= true;
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
            xhr.withCredentials= true;
            xhr.open('GET', `https://api.bilibili.com/pgc/player/web/playurl?ep_id=${id}&qn=${QN}&otype=json`, false)
            xhr.send()

            let durl = JSON.parse(xhr.responseText).result.durl
            if (durl.length < 2) {
                return [durl[0].url]
            } else {
                return durl.map(value => value.url)
            }
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
        if(href) a.href = href
        if(download) a.download = download
        if(onclick) a.onclick = onclick
        return a
    }

    let download = function (){
        if(document.querySelector('#viewbox_report') || document.querySelector('.media-wrapper')) {
            TITLE = document.querySelector('#viewbox_report h1') ? document.querySelector('#viewbox_report h1').title : document.querySelector('.media-wrapper h1').title

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
            for(let i of exporterType) {
                dd.appendChild(createA(i))
            }
            dd.appendChild(createA({textContent: '帮助', href: 'https://github.com/evgo2017/bilibili_vedio_download'}))
            document.body.appendChild(dd)
        } else {
            setTimeout(download, 1000)
        }
    }

    // @match       *://www.bilibili.com/video/av*
    // @match       *://www.bilibili.com/bangumi/play/ep*
    let currentURL = window.location.href
    if(currentURL.search('ep') > -1) {
        let epStatus = function (){
            console.log(currentURL.search('ep'))
            if(window.__INITIAL_STATE__ && window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.epStatus>=2) {
                URLS = Info.Bangumi()
                setTimeout(download, 1000)
            } else {
                setTimeout(epStatus, 1000)
            }
        }
        setTimeout(epStatus, 1000)
    } else if(currentURL.search('av') > -1){
        let avState = function (){
            if(window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData.pages) {
                URLS = Info.Vedio()
                setTimeout(download, 1000)
            } else {
                setTimeout(avState, 1000)
            }
        }
        setTimeout(avState, 1000)
    }
})()
