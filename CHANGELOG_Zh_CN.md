# 更新日志

感谢大家的的使用以及建议！

## 2019/07/21

- 增加：弹幕 XML 地址 > JSON 格式

  ```
  此为大坑处，因为 XML 文件 Headers 格式： Transfer-Encoding: chunked、Content-Encoding: deflate，推荐的 IDM 和 Aria2 下载工具解压文件有误。
  经过测试，以下几种方式可以方便的下载成功：
  ① Linux：curl -O url --compressed；
  ② Windows PowerShell：curl -OutFile C:\data\1.flv -H @{"Referer"="referer"} -Uri "url"；
  ③ 软件：浏览器直接右键保存、QNAP Download Station、FDM 等.
  
  故考虑到方便性和需求程度，以及可更新弹幕的想法，不提供 XML 文件直接下载，而是提供 XML  的数据（JSON 格式）
  ```

- 增加：设置页面->开启/关闭 `下载弹幕 JSON` 功能

## 2019/07/10

- 增加：设置页面->播放页 QN 以播放器为准

  ```
  之前默认 QN 在播放页面以播放器的清晰度为准，现在让用户来选择是否启用此设定
  ```

- 完善：最高清晰度（QN）->下拉菜单文字选择

  ```
  用户体验提高：输入清晰度对应数字->在下拉菜单选择清晰度文字
  ```

## 2019/07/09 - v1.2.0

- 完善：修改配置->刷新下载数据

  ```
  重构数据交互方式，提高性能
  降低数据与 DOM 耦合度，解决切换设置时卡顿现象
  减少重建 DOM 的情况，直接重获数据即可
  ```

- 修复：收藏页/追番剧页面->文件夹特殊字符的替换

  ```
  错误举例：文件夹名称：“测试/完结”，下载时会形成(C:\项目\测试\完结)层级目录
  ```

## 2019/07/08

- 增加：封面图下载功能

- 增加：设置页面->开启/关闭 `下载封面图 ` 功能

  ```
  因为番剧页面 -webkit-appearance: none 的存在，需要对 checkbox 进行设置 -webkit-appearance: checkbox，所以导致在部分番剧页面切换开启/关闭时导致较为明显的卡顿。
  究其原因，与更新配置后重建 DOM 的行为分不开，之后会解决这个问题
  ```

## 2019/07/07

- 增加：4K QN（感谢 @[RJTT233 ](<https://github.com/RJTT233>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/4>)）

  ```
  最高清晰度为 4K，120
  ```

- 完善：以 `Local Storage` 替代了 `Cookies` （感谢 @[mkanako](<https://github.com/mkanako>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/2>)）

## 2019/07/06  - v1.1.0


- 增加：功能列表->设置（感谢 @[mkanako](<https://github.com/mkanako>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/2>)）

  ```
  通过设置 Cookies 的方式，来保存用户设置，避免代码更新删除用户配置。
  其实可以使用 GM_setValue && GM_getValue 方法，但是由于代码需要页面的上下文来获取一些数据，所以必须设置 grant 为 none，故不可用 GM_* 等功能
  ```

- 完善： QN，灵活设置当前单集的清晰度，而不是一直为默认值

  ```
  获取 Cookie 的 CURRENT_QUALITY
  视频的某 Part / 番剧的某集，以当前播放器的 QN 为准，其余时候均以设置的 QN 为准
  ```

- 修复： `aria2` 的 `rpc` 目录设置（感谢 @[mkanako](<https://github.com/mkanako>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/3>)）

  ```
  { 'referer': `${REFERER}`, 'out': `${BASEDIR}${out}.FLV`, 'dir': `${dir}` } 
  =>
  { 'referer': ${REFERER}, 'dir': ${BASEDIR}${dir}, 'out': ${out}.FLV }
  ```

