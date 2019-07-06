# bilibili_video_download

B站视频下载，油猴插件

单/多P，单/多集，多视频/番剧正片，大会员，IDM、Aria2、Aria2RPC 导出方式，Local Storage  方式保存配置

注：此工具仅方便个人收藏视频之用，所获数据绝不传播或谋取利益。违者责任自负。

> 所有功能建立在个人账号权限基础之上：清晰度和视频专享也需要你本身是大会员

## 应用示例

不同页面会在【左侧】出现不同的【功能列表】，选择【下载】即可。

### 1. 设置页

点击 `设置` 开启和关闭设置页 ；设置页修改的配置**立即生效**；配置数据以 `Local Storage` 形式保存，不会因为更新版本而导致用户配置被覆盖

> 在修改配置之前打开的页面，需要刷新，当前和之后打开的页面无需
>
> 本可用 GM_setValue && GM_getValue 存储，但是由于代码需要页面的上下文来获取一些数据，所以必须设置 grant 为 none，故不可用 GM_* 等功能

![setting](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/setting.PNG)

### 2. 详情页

可下载【单个】或者【所有】Part、集

#### 视频

![vedio](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/video.PNG)

#### 番剧

![bangumi](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/bangumi.PNG)

#### 影视

![cinema](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/cinema.PNG)

### 3. 收藏页/追番/追剧

可下载某收藏夹内、追番、追剧内所有数据；

点击 `获取数据`，之后在 `下载方式` 选择即可

> 因为是大批量数据，所以采用手动激活获取的方式
>
> 批量下载功能，暂时只支持正片。预告片、花絮等请采用单集手动下载（如果此需求较多，我再添加）

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
- [ ] 其他下载
  - [ ] 视频封面图
  - [ ] 弹幕（没有弹幕的 Bilibili 是没有灵魂的）
    - [ ] 定时更新弹幕
- [x] 功能列表
  - [x] 无需刷新页面->更新列表
  - [x] 播放页面
  - [x] 收藏夹/追番/追剧
    - [x] 点击按钮再获取数据（否则数据过多会导致白屏）
  - [x] 设置配置页面
    - [x] 修改即生效（修改配置前打开的页面需要刷新）
    - [ ] 清晰度->改为列表选择
- [x] 保存用户设置
  - [x] 避免更新删除用户配置（感谢@[mkanako](<https://github.com/mkanako> )，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/2> ) ）
- [x] 下载方式
  - [x] IDM
  - [x] Aria2
  - [x] Aria2RPC
    - [x] Windows 下自动切换端口转发开启/关闭
- [x] 设置下载的清晰度（默认 116）
  - [x] 视频的某 Part / 番剧的某集，以当前播放器的 QN 为准
  - [x] 其余时候均以设置的 QN 为准
- [x] 大会员专享（本身也是会员才行）
- [ ] 报告获取数据进度
- [ ] 异常捕获与处理
  - [ ] 某数据获取失败则跳过报告

## 使用方法

### 安装油猴

① 安装 [Tampermonkey](<http://www.tampermonkey.net/> )  插件

② 添加新脚本，复制 `index.js` 代码进去保存即可

③ 或者在 [Greasy Fork](<https://greasyfork.org/zh-CN/users/314220-evgo2017> ) 中搜索  [bilibili_video_download](<https://greasyfork.org/zh-CN/scripts/387123-bilibili-video-download> )

### 下载方式

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

① 采用 `Docker` ，镜像推荐 `wahyd4/aria2-ui`，主机端口 `6800` 映射到容器端口 `6800`（默认 `6800`），挂载 `/data/` 数据卷， 容器内配置 RPC；

② 通过 `toggleForwardingPort.bat` 文件：Windows 下自动切换端口转发，如果已转发则删除转发，未转发则开启转发。因为 `HTTPS` 与 `HTTP` 协议，自己写的一个小工具。

![toggleForwardingPort](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/toggleForwardingPort.PNG)

## 相关参数

主要是 `BASEDIR` ，`ARIA2RPC` 、 `ARIA2TOKEN` 和 `QN` 三个参数。

> 修改配置，直接在设置页修改即可    -2019/7/6

![options](https://evgo-website.oss-cn-shanghai.aliyuncs.com/img/post/bilibili_video_download/options.PNG)

### BASEDIR

文件夹基本路径，末尾一定要有 `/`，默认为 `./`，`Aria2c.exe` 所在文件夹内。

如果是 Docker，一般配置为 `/data/`。

### ARIA2RPC、ARIA2TOKEN

与 `ARIA2RPC` 下载方法有关， 若不使用此方法则无需设置。

`ARIA2RPC` ：基本无需改动。

`ARIA2TOKEN` ：如果有设置 `token` ，则需要修改。

### QN

建议 `QN` 设置为 `120`，即使视频达不到此清晰度，但会默认返回个人账号和视频支持的最高清晰度。

> 感谢 @[RJTT233](<https://github.com/RJTT233> )，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/4> ) 补充的 4K 信息

| qn（quality） | 清晰度       | 权限   |
| ------------- | ------------ | ------ |
| 120           | 超清 4K      | 大会员 |
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

Github：<https://github.com/evgo2017/bilibili_video_download>