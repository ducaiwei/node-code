#### 命令行http服务器
可以用于代理本地静态文件，参照http-server实现，用于学习node服务器开发很有用。


#### 快速上手
由于没有发布到npm库，所以没办法通过npm安装
1. 克隆代码到本地
2. npm install
3. npm link
4. npm link static-server 可以使用


#### http缓存
缓存是浏览器对之前请求的文件进行缓存,以便下一次访问时重复请求,节省宽带,降低服务器压力

1. http缓存分为强制缓存、协商缓存<br/>
    1.1. 强制缓存是指服务器设置了Expires或者Cache-Control: max-age响应头;指定文件的缓存时长<br/>
    浏览器再次请求时,缓存还未过期,浏览器会直接读取缓存的文件,不会向服务器发起请求<br/>
    
    1.2. 协商缓存是指服务器在返回时,设置了Last-Modified、Etag响应头;<br/>
        Last-Modified是当前文件最后的修改时间,Etag(可以通过crypto模块生成)是文件唯一令牌<br/>
        当浏览器再次向服务器发起请求时,会上述两个头部的值通过if-modified-since和if-none-match<br/>
        这两个请求头传给服务器,服务器会拿当前文件的修改时间和令牌来作比较,如果都一致,返回304,告知浏览<br/>器从缓存中取。
