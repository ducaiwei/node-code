#### node实现gzip压缩
1、浏览器发起请求头会带上'Accept-Encoding',表示可以接受的压缩方式,chrome支持gzip、deflate、br三种方式

2、服务器根据请求头Accept-Encoding的值对response的内容做压缩,node自带的zlib目前只支持gzip和deflate两种方式

3、服务器同时需要设置响应头的Content-Encoding,告知浏览器解压缩方式