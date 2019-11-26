const http = require('http');
const fs = require('fs');
const zlib = require('zlib');

http
  .createServer((req, res) => {
    const reg = /\.html|\.css|\.js/;
    if (reg.test(req.url)) {
      const extName = req.url.match(reg)[0];
      const { headers } = req;
      res.setHeader('Content-type',  `text/${extName.replace('\.', '')}; charset=utf-8`)
    //   if (headers['accept-encoding'].includes('gzip')) {
    //     res.setHeader('Content-Encoding', 'gzip');
    //     fs.createReadStream(`./public${req.url}`).pipe(zlib.createGzip()).pipe(res);
    //     return;
    //   }
      if (headers['accept-encoding'].includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
        fs.createReadStream(`./public${req.url}`).pipe(zlib.createDeflate()).pipe(res);
        return;
      }
      fs.createReadStream(`./public${req.url}`).pipe(res);
    }
  })
  .listen(3000);
