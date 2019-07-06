# 更新日志

感谢大家的的使用以及建议！

## 2019/07/07

- 增加：4K QN（感谢 @[RJTT233 ](<https://github.com/RJTT233>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/4>)）

  ```
  最高清晰度为 4K，120
  ```

- 完善：以 `Local Storage` 替代了 `Cookies` （感谢 @[mkanako](<https://github.com/mkanako>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/2>)）

## 2019/07/06


- 增加：功能列表->设置（感谢 @[mkanako](<https://github.com/mkanako>) ，[issues](<https://github.com/evgo2017/bilibili_video_download/issues/2>)）

  ```
  通过设置 Cookies 的方式，来保存用户设置，避免代码更新删除用户配置。
  其实可以使用 GM_setValue && GM_getValue 方法，但是由于代码需要页面的上下文来获取一些数据，所以必须设置 grant 为 none，故不可用 GM_* 等功能。
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

