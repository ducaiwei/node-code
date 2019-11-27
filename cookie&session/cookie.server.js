const http = require('http');
const crypto = require('crypto');
const secret = 'test-cookie'; // 秘钥
const querystring = require('querystring');
// 加签函数 使用
const signFn = value => {
  // createHmac 创建一个Hmac类实例  可以通过以下两种方式使用
  // 作为可读写的流，其中写入数据以在可读侧生成计算后的摘要
  // 使用hmac.update()和hmac.digest()方法生成计算后的摘要
  // base64是基于64个可打印字符来表示二进制数据的方式 2的6次方等于64 所以每6个比特位为一个单元，对应某个可打印字符
  // 64个字符包括大小写英文字符 + '+' + '/'; 以'='结尾
  // 因为base64编码占用了+和/和=  所以不能识别编码内容中的+、/、=
  return crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/\=/, '');
};
// 获取cookie
const getCookie = (req, opts) => {
  const cookies = req.headers['cookie'];
  // querystring.parse解析url参数
  // querystring.parse(str[,sep[,eq[,options]]])
  // sep 用来分割每一对键和值的  默认是&
  // eq 用来分隔查询字符串中的键和值的子字符串 默认是=
  let obj = querystring.parse(cookies, '; ');
  return obj;
};
let cookies = [];
// 设置cookie
const setCookie = (res, key, value, opts) => {
  // maxAge: cookie过期时间
  // httpOnly: 标识js是否能读取  true表示不能读取
  // domain 设置cookie的所存的域名，只可以设置当前域名的主域
  // path 设置cookie存在的路径
  // signed cookie值是否加签
  const { maxAge, httpOnly, domain, path, signed } = opts;
  let options = [];
  let cookie = `${key}=${value}`;
  if (signed) {
    cookie = `${cookie}.${signFn(value)}`;
  }
  if (maxAge) {
    options.push(`max-age=${maxAge}`);
  }
  if (httpOnly) {
    options.push(`httpOnly=true`);
  }
  if (domain) {
    options.push(`domain=${domain}`);
  }
  if (path) {
    options.push(`path=${path}`);
  }
  cookie = `${cookie}; ${options.join('; ')}`;
  cookies.push(cookie);
  // 设置cookie的header key是Set-Cookie, value是数组 'name=xxxx;password=xxxx;'
  res.setHeader('Set-Cookie', cookies);
};
http
  .createServer((req, res) => {
    if (req.url === '/read') {
      // 读取cookie
      const cookies = getCookie(req, { signed: true });
      res.end(JSON.stringify(cookies));
    } else if (req.url === '/write') {
      // 写cookie
      setCookie(res, 'userName', 'nelson', { signed: true, httpOnly: true });
      // 子域可以向主域中写入cookie  其他子域可以获取到同一个主域的cookie
      setCookie(res, 'userId', '123', {
        signed: true,
        httpOnly: true,
        domain: '.weidu.shop'
      });
      res.setHeader('Content-Type', 'text/html;charset=utf-8');
      res.end('写入cookie成功');
    }
  })
  .listen(3000);
