// session的功能
// cookie 是不安全的 如果服务端设置的cookie 浏览器可以看到具体内容
// session 来基于 cookie实现的安全些

/**
 * demo主要通过session和cooike来模拟登陆
 */
const http = require('http');
const uuid = require('uuid');
const crypto = require('crypto');
const secret = 'test-session'; // 秘钥
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
const getCookie = (req, key, opts) => {
  let cookies = req.headers['cookie'];
  // querystring.parse解析url参数
  // querystring.parse(str[,sep[,eq[,options]]])
  // sep 用来分割每一对键和值的  默认是&
  // eq 用来分隔查询字符串中的键和值的子字符串 默认是=
  cookies = querystring.parse(cookies, '; ');
  const { signed } = opts;
  let cookie = cookies[key];
  if (cookie) {
    // 加签校验
    const [value, sign] = cookie.includes('.') ? cookie.split('.') : [cookies];
    if (signed) {
      if (sign === signFn(value)) {
        return value;
      }
      return 'cookie值有篡改';
    }
    return value;
  }
  return '';
  return obj[key] || '';
};
let cookies = [];
const session = {};
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
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    let loginId = getCookie(req, 'loginId', {
        signed: true
      });
    if (req.url === '/login') {
      loginId = uuid.v4();
      setCookie(res, 'loginId', loginId, {
        signed: true,
        httpOnly: true
      });
      session[loginId] = {
        login: true
      };
      res.end('登录页面');
    } else {
      if (loginId && session[loginId]) {
        // 已经登陆
        res.end('已经登陆');
      } else {
        // 未登录 301永久重定向,302临时重定向
        res.writeHead(302, { Location: `http://${req.headers.host}/login` });
        res.end();
      }
    }
  })
  .listen(3000);
