// http-server模块
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { createReadStream, readFileSync } = require('fs');

// 第三方模块
const chalk = require('chalk');
const mime = require('mime'); // 获取文件mime type
const ejs = require('ejs');

class Server {
  constructor(config) {
    this.port = config.port;
    this.dir = config.dir;
  }
  getIp() {
    let interfaces = os.networkInterfaces();
    let ipv4;
    for (let key in interfaces) {
      interfaces[key].forEach(item => {
        if (item.family === 'IPv4' && key === 'en0') {
          ipv4 = item.address;
        }
      });
    }
    return ipv4;
  }
  async handleRequest(req, res) {
    // 请求path
    let { pathname } = url.parse(req.url);
    pathname = decodeURIComponent(pathname);
    // 绝对路径
    const absPath = path.join(this.dir, pathname);
    try {
      const obj = await fs.stat(absPath);
      if (obj.isFile()) { // 如果当前请求的是文件直接返回
        this.sendFile(absPath, req, res, obj);
      } else { 
        // 如果是目录  列出所有内容
        let contents = await fs.readdir(absPath);
        contents = contents.map(item => {
          return {
            current: item,
            path: path.resolve(pathname, item)
          }
        });
        const template = readFileSync(path.resolve(__dirname, './template.html'));
        const resStr = ejs.render(template.toString('utf-8'), {
          items: contents
        });
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        res.end(resStr);
      }
    } catch (error) {
      console.log(chalk.red(error));
    }
  }
  // 处理缓存
  handleCache(path, req, res, statObj) {
    // 强制缓存 直接访问特定的资源 不会有强制缓存  引用的资源有强制缓存
    res.setHeader('Cache-Control', 'max-age=10');
    res.setHeader('Expires', new Date(Date.now() + 10 * 1000).toGMTString());
    // 协商缓存
    // Last-Modified
    let ctime = statObj.ctime.toGMTString();
    res.setHeader('Last-Modified', ctime);
    // Etag
    let content = readFileSync(path, 'utf-8'); // 读取文件内容
    // 根据文件内容生成令牌
    let etag = require('crypto').createHash('md5').update(content).digest('base64');
    res.setHeader('Etag', etag);

    // 从请求头读取Last-Modified和Etag做对比
    let ifModifiedSince = req.headers['if-modified-since'];
    let ifNoneMatch = req.headers['if-none-match'];
    if(ctime !== ifModifiedSince) { // 最后修改时间不一致说明有更新  不需要缓存
      return false;
    }
    if(ifNoneMatch !== etag) { // 文件令牌不一致说明有更新 不需要更新
      return false;
    }
    return true;
  }
  // 
  sendFile(path, req, res, statObj) {
    if(this.handleCache(path, req, res, statObj)){
      res.statusCode = 304;
      return res.end();
    }
    res.setHeader('Content-Type', mime.getType(path) + ';charset=utf-8');
    // 可读流返回
    createReadStream(path).pipe(res);
  }
  start() {
    const server = http.createServer(this.handleRequest.bind(this));
    server.listen(this.port, () => {
      console.log(
        `${chalk.yellow('Starting up http-server, serving')}./${this.dir
          .split('\\')
          .pop()}
Available on:
http://127.0.0.1:${this.port}
http://${this.getIp()}:${this.port}
Hit CTRL-C to stop the server`
      );
    });
  }
}
module.exports = Server;
