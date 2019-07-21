# 下载方式

各方法利弊：

| 名称            | 下载视频/封面图 | 下载弹幕 | 文件夹/文件命名 | 远程 |
| --------------- | --------------- | -------- | --------------- | ---- |
| IDM             | √               | ×        | ×               | ×    |
| Aria2           | √               | ×        | √               | √    |
| PowerShell/Curl | √               | √        | √               | √    |

## 一、PowerShell/Curl

其实这个方法就是自己写个脚本，批量执行就好。

目前批量下载弹幕用这种方法较为方便，之后有更合适的工具再更新吧。将导出的【弹幕 JSON】文件，转为各个下载工具适用的格式。比如 Windows 下的  PowerShell 格式（下载地址为绝对地址）：

```
curl -OutFile C:\data\dir\title.xml -H @{"Referer"="https://www.bilibili.com"} -Uri "xml url"
```

## 二、IDM

导入下载的文件即可。不过此方法不可以给文件自动命名（也许是我没有找到）。

![idm](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/idm.PNG)

## 三、Aria2

> 推荐：<http://aria2c.com/> 

### 1. 简易

方法：在 [Aria2 & YAAW 使用说明](<http://aria2c.com/usage.html>)  中 【Arai2 相关下载】中选择【Windows 懒人包下载（包含以下文件）】，打开命令行输入：

```
./aria2c -i download.session
```

参考图：

![aria2](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/aria2.PNG)

### 2. Aria2RPC

最推荐这个方法。此方法不需要下载、导入任何文件。

#### Windows

打开 `aria2.exe` 即可。参考图：

![aria2rpc](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/aria2rpc.PNG)

#### Linux

我的方法：

① 采用 `Docker` ，镜像推荐 `wahyd4/aria2-ui`，主机端口 `6800` 映射到容器端口 `6800`（默认 `6800`），挂载 `/data/` 数据卷， 容器内配置 RPC；

② 通过 `toggleForwardingPort.bat` 文件：Windows 下自动切换端口转发，如果已转发则删除转发，未转发则开启转发。因为 `HTTPS` 与 `HTTP` 协议，自己写的一个小工具。

![toggleForwardingPort](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/toggleForwardingPort.PNG)