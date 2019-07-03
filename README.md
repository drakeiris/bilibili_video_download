# bilibili_video_download

B站视频下载，油猴插件

单/多P，单/多集，多视频/番剧正片，大会员，IDM、Aria2、Aria2RPC 导出方式

注：此工具仅方便个人收藏视频之用，所获数据绝不传播或谋取利益。

> 所有功能建立在个人账号权限基础之上：清晰度和视频专享也需要你本身是大会员

## 应用示例

不同页面会在【左侧】出现不同的【功能列表】，选择【下载】即可。

### 1. 详情页

可下载【单个】或者【所有】Part、集。

视频：

![vedio](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/video.PNG)

番剧：

![bangumi](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/bangumi.PNG)

影视：

![cinema](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/cinema.PNG)

### 2. 收藏页/追番/追剧

可下载某收藏夹内、追番、追剧内所有数据。

点击【获取数据】，之后选择【下载方式】即可。因为是大批量数据，所以采用手动激活方式。

> 批量下载功能，暂时只支持正片。预告片、花絮等请采用单集手动下载（如果此需求较多，我再添加）。

#### 我的订阅

追番与追剧：

![subscription](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/subscription.PNG)

#### 获取数据

![getData](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/getData.PNG)

#### 选择下载

![funcList](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/funcList.PNG)

## 描述

每一个视频都会自动生成对应的文件夹，包含视频（弹幕）

## 具体功能

> 建议使用 Chrome 浏览器，目前只在 Chrome 浏览器上测试

- [x] 视频
  - [x] 播放页面内->当前视频
    - [x] 单 Part 下载
    - [x] 全 Part 下载
  - [x] 收藏->某收藏夹->全部视频
    - [x] 全 Part 下载
- [x] 番剧
  - [x] 播放页面内->当前番剧
    - [x] 单集下载
    - [x] 全集正片下载
  - [x] 订阅->追番/剧->全部番/剧
    - [x] 全集正片下载
- [x] Part/集分段下载
  - [ ] 分段自动合并
- [x] 功能列表
  - [x] 无需刷新页面->更新列表
  - [x] 播放页面
  - [x] 收藏夹/追番/追剧
    - [x] 点击按钮再获取数据（请求过多会白屏较长时间）
- [x] 下载方式
  - [x] IDM
  - [x] Aria2
  - [x] Aria2RPC
    - [x] Windows 下自动切换端口转发开启/关闭
- [x] 设置下载的清晰度（默认 116）
- [x] 大会员专享（本身也是会员才行）
- [ ] 下载弹幕（没有弹幕的 Bilibili 是没有灵魂的）
  - [ ] 定时更新弹幕
- [ ] 报告获取数据进度
- [ ] 异常捕获与处理
  - [ ] 某数据获取失败则跳过报告

## 油猴

① 安装 Tampermonkey  插件

② 添加新脚本，复制 `index.js` 代码进去保存即可

③ 或者在 [Greasy Fork](<https://greasyfork.org/zh-CN/users/314220-evgo2017> ) 中搜索  [bilibili_video_download](<https://greasyfork.org/zh-CN/scripts/387123-bilibili-video-download> )

## 下载方式

简单介绍一下，及个人配置

#### 1. IDM

导入下载的文件即可。不过此方法不可以给文件自动命名（也许是我没有找到）。

![idm](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/idm.PNG)

#### 2. Aria2

> 推荐：<http://aria2c.com/> 

① 在 [Aria2 & YAAW 使用说明](<http://aria2c.com/usage.html>)  中 【Arai2 相关下载】中选择【Windows 懒人包下载（包含以下文件）】

② 导出的文件

③ 命令行方式：

```
./aria2c -i download.session
```

> 默认情况下，视频会下载到此文件夹内。

![aria2](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/aria2.PNG)

#### 3. Aria2RPC

最推荐这个方法。此方法不需要下载、导入任何文件。

Windows 用户打开 `aria2.exe` 即可。

![aria2rpc](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/aria2rpc.PNG)

Linux 下我的方法：

① 采用 Docker ，镜像推荐 `wahyd4/aria2-ui`，主机端口 6800 映射到容器端口 6800（默认6800），挂载 `/data/` 数据卷， 容器内配置 RPC；

② 通过 `toggleForwardingPort.bat` 文件：Windows 下自动切换端口转发，如果已转发则删除转发，未转发则开启转发。因为 `HTTPS` 与 `HTTP` 协议，自己写的一个小工具。

![toggleForwardingPort](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/toggleForwardingPort.PNG)

## 参数设置

主要是 `BASEDIR` ，`ARIA2RPC` 、 `ARIA2TOKEN` 和 `QN` 三个参数。

![options](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/options.PNG)

### BASEDIR

文件夹基本路径，末尾一定要有 `/`，默认为 `./`，`Aria2c.exe` 所在文件夹内。

如果是 Docker，一般配置为 `/data/`。

### ARIA2RPC、ARIA2TOKEN

与 `ARIA2RPC` 下载方法有关， 若不使用此方法则无需设置。

`ARIA2RPC` 基本无需改动。

`ARIA2TOKEN` 如果有设置 `token` ，则需要修改。

### QN

建议 `QN` 设置为 `116`，即使视频达不到此清晰度，但会默认返回个人账号和视频支持的最高清晰度。

| qn（quality） | 清晰度       | 权限   |
| ------------- | ------------ | ------ |
| 116           | 高清 1080P60 | 大会员 |
| 112           | 高清 1080P+  | 大会员 |
| 74            | 高清 720P60  | 大会员 |
| 80            | 高清 1080P   | 登陆   |
| 64            | 高清 720P    | 登陆   |
| 32            | 清晰 480P    |        |
| 16            | 流畅 360P    |        |
| 0             | 自动         |        |

## 最后

如果有问题或者需求，请提 `issues` 或者联系我，谢谢。