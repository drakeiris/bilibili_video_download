`list.so` 文件是未被解压的数据，可用 `client.js` 进行测试。

`server.js` 会返回正确的 `deflate(zlib)` ，而不是 `list.so` 这份 `raw deflate` 。

