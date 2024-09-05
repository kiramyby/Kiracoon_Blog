# 鉴权及JWT分析

<br>

> （写于2023年12月）

> 这篇其实时间跨度很长，从期中考试前的C语言课到更新这天，主要还是根据之前列的东西慢慢学吧~ 这段时间变化和想法都挺多的，不过就留到其他时候再说吧，这里专注于鉴权和JWT~

## 主要鉴权方法

主要有以下几类

* HTTP Basic Authentication
* Session-Cookie
* Token
* OAuth
* LDAP

还有一些基于基本认证方式搭建的鉴权体系，比如`SSO`

## HTTP Basic Authentication

> 一种很简单的认证方式，所以同时也很不安全

基于HTTP请求，用请求头`Authorization`携带认证信息

在没有认证信息的情况下服务器会返回`401`状态，带有`WWW-Anthenticate`头指出安全域

```http
GET /private/index.html HTTP/1.0
Host: localhost
```

```http
HTTP/1.0 401 Authorization Required
Server: HTTPd/1.0
Date: Sat, 27 Nov 2004 10:18:15 GMT
WWW-Authenticate: Basic realm="Secure Area"
Content-Type: text/html
Content-Length: 311

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
 "http://www.w3.org/TR/1999/REC-html401-19991224/loose.dtd">
<HTML>
  <HEAD>
    <TITLE>Error</TITLE>
    <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=ISO-8859-1">
  </HEAD>
  <BODY><H1>401 Unauthorized.</H1></BODY>
</HTML>
```

ID `Aladdin`  Password `open sesame`

```http
GET /private/index.html HTTP/1.0
Host: localhost
Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```

当然不需要交互直接发送`Authorization`也可以

采用`base64`对`ID:Password`格式的认证信息进行编码，本质是一种明文传输，更适合在相对安全的环境中采用（好像可以在`https`中用）

优点是广泛支持,设置简便

关于`Apache`和`Nginx`的设置可以参见[HTTP 身份验证 - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication#使用_apache_限制访问和_basic_身份验证)



### Digest Authentication

> 感觉把摘要认证视为对HTTP基本认证的小优化会更好

本质是将明文传输变成携带验证方式的传输，通过摘要值可以对信息进行校验、防篡改（？

在摘要认证中，服务器验证客户端发送的摘要的正确性的步骤如下：

1. 服务器收到客户端发送的摘要后，会根据摘要中的信息和服务器存储的用户密码进行计算，生成一个期望的摘要值。
2. 然后，服务器将生成的期望摘要值与客户端发送的摘要值进行比较。
3. 如果两个摘要值相匹配，则服务器会验证通过，允许客户端继续访问所请求的资源。
4. 如果两个摘要值不匹配，则服务器会拒绝客户端的请求，并返回相应的错误信息。

给个小示例

```http
HTTP/1.0 401 Authorization Required
WWW-Authenticate: Digest realm="example", qop="auth", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"

```

```http
GET /index.html HTTP/1.0
Authorization: Digest username="alice", realm="example", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", uri="/dir/index.html", qop=auth, nc=00000001, cnonce="0a4f113b", response="6629fae49393a05397450978507c4ef1", opaque="5ccc069c403ebaf9f0171e9517f40e41"
```



## Session-Cookie

> 在服务器中储存会话数据，基于`session_id`进行识别调用

### Cookie

> 使无状态的http可以承载状态信息

`Cookie`是服务器发送到用户浏览器并保存在本地的一小块数据。浏览器会存储`cookie`并在下次向同一服务器再发起请求时携带并发送到服务器上。

```http
HTTP/1.0 200 OK
Content-type: text/html
Set-Cookie: yummy_cookie=choco
Set-Cookie: tasty_cookie=strawberry
```

设定Cookie时可以设定一些参数，`Expires` 过期时间，`Secure` `HttpOnly`限制访问，`Domain` `Path`定义Cookie作用域，`SameSite`设置跨站发送限制，还有`__Host-`和`__Secure-`前缀用于断言特定事实

主要有三方面功能：

* **会话状态管理**  如用户登录状态、购物车、游戏分数或其他需要记录的信息
* **个性化设置**  如用户自定义设置、主题和其他设置
* **浏览器行为跟踪**  如跟踪分析用户行为等



### Session

1. 服务端在接收到来自客户端的首次访问时，会自动创建 Session（将 Session 保存在内存中，也可以保存在 Redis 中），然后给这个 Session 生成一个唯一的标识字符串会话身份凭证 `session_id`（即 `sid`），并在响应头 `Set-Cookie` 中设置这个唯一标识符
2. （非必须）签名，对 `sid` 进行加密处理，服务端会根据这个 `secret` 密钥进行解密
3. 浏览器收到请求响应后会解析响应头，并自动将 `sid` 保存在本地 Cookie 中，浏览器在下次 HTTP 请求时请求头会自动附带上该域名下的 Cookie 信息
4. 服务端在接收客户端请求时会去解析请求头 Cookie 中的 `sid`，然后根据这个 `sid` 去找服务端保存的该客户端的 `sid`，然后判断该请求是否合法
5. 一旦用户登出，服务端和浏览器将会同时销毁各自保存的会话 ID，服务端会根据数据库验证会话身份凭证，如果验证通过，则继续处理

流程可以参考下图

![session-cookie](https://doc.k1r4ca.top/pic/session-cookie202404132322692.jpg)

### and More

session和cookie还是存在很多区别的，详见[Cookie和Session的区别 | Xiaoxi'Blog](https://wangxiaoxi.cn/posts/http-cookie/)

session方案在内存占用和安全方面是存在不足的

## Token认证

> 很多公有API和开发框架的内部API调用都是基于Token认证

Token 和 Session-Cookie 认证方式中的 Session ID 不同，并非只是一个标识符。Token 一般会包含用户的相关信息，通过验证 Token 不仅可以完成 `身份校验`，还可以获取 `预设的信息` 。

流程中的主要特点：

1. Token储存在客户端
2. 后续Token被附带于`Authorization`字段中，
3. 客户端负责校验Token的结构内容是否符合要求

具体流程如图

![Token](https://doc.k1r4ca.top/pic/token202404132318473.jpg)

优点：服务端无状态，无需访问远程访问或数据库，支持跨域跨程序调用，可以有效避免CSRF（无cookie）

缺点：更大占带宽，需要解密消耗性能

> 详情请见后文JWT章节

###  Session-Cookie 和 Token 的对比

Session-Cookie 认证仅仅靠的是 `sid` 这个生成的唯一标识符，服务端需要根据客户端传来的 `sid` 查询保存在服务端 Session 里保存的登录状态，当存储的信息数据量超过一定量时会影响服务端的处理效能。而且 Session-Cookie 认证需要靠浏览器的 Cookie 机制实现，如果遇到原生 NativeAPP 时这种机制就不起作用了，或是浏览器的 Cookie 存储功能被禁用，也是无法使用该认证机制实现鉴权的。

Token 认证机制特别的是，实质上登录状态是用户登录后存放在客户端的，服务端不会充当保存 `用户信息凭证` 的角色，当每次客户端请求时附带该凭证，只要服务端根据定义的规则校验是否匹配和合法即可，客户端存储的手段也不限于 Cookie，可以使用 Web Storage 等其他缓存方式。

简单来说，Session-Cookie 机制限制了客户端的类型，而 Token 验证机制丰富了客户端类型。而且Token机制更像是一种框架，可供用户更灵活地构建鉴权微服务



## OAuth

> 选择——“通过第三方认证登录

OAuth（开放授权）是一个开发标准，允许用户授权 `第三方网站` 访问他们存储在另外的服务提供商中的信息，而不需要接触到用户名和密码。为了保护数据的安全和隐私，第三方网站访问用户数据前都需要 `显式地向用户征求授权`。我们常见的 OAuth 认证服务的厂商有微信、QQ、支付宝等。

OAuth 协议又有 1.0 和 2.0 两个版本，2.0 版整个授权验证流程更简单更安全，也是目前最主要的用户身份验证和授权方式。

应用场景有：第三方应用的接入、微服务鉴权互信、接入第三方平台、第一方密码登录等。

具体看这篇：[理解OAuth 2.0 - 阮一峰的网络日志 (ruanyifeng.com)](https://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html)



## LDAP

> 有提到LDAP可以实现SSO是一种误区

 轻量目录访问协议`Lightweight Directory Access Protocol`，一个开放、广泛被使用的工业标准（IEFT、RFC）。企业级软件也通常具备 **支持 LDAP*- 的功能，比如 Jira、Confluence、OpenVPN 等，企业也经常采用 LDAP 服务器来作为企业的认证源和数据源。

它的主要功能点或场景：

- 作为数据源它可以用于存储
  - 企业的组织架构树
  - 企业员工信息
  - 证书信息
  - 会议室，打印机等等资源
- 作为认证源，它也有多种用途
  - 存储用户的密码
  - 对外提供 LDAP 协议的认证方式（通过 LDAP BIND 协议来校验用户名和密码）
  - 密码策略（密码复杂度，历史密码记录，用户锁定等等）

## SSO

> 单点登录`Single Sign-on`，在多系统集群中的

### 同域 SSO（Session-Cookie）

> 实际就是利用Session-Cookie的特性

当存在两个相同域名下的系统 A `a.abc.com` 和系统 B `b.abc.com` 时，以下为他们实现 SSO 的步骤：

1. 用户访问某个子系统时（例如 `a.abc.com`），如果没有登录，则跳转至 SSO 认证中心提供的登录页面进行登录
2. 登录认证后，服务端把登录用户的信息存储于 Session 中，并为用户生成对应的会话身份凭证附加在响应头的 `Set-Cookie` 字段中，随着请求返回写入浏览器中，并回跳到设定的子系统链接中
3. 下次发送请求时，当用户访问同域名的系统 B 时，由于 A 和 B 在相同域名下，也是 `abc.com`，浏览器会自动带上之前的 Cookie。此时服务端就可以通过该 Cookie 来验证登录状态了。

### 跨域 SSO（CAS）

> 其实这个才是SSO的标准实现，基于CAS

**CAS**（Central Authentication Service）中央授权服务，本身是一个开源协议，分为 1.0 版本和 2.0 版本。1.0 称为基础模式，2.0 称为代理模式，适用于存在非 Web 应用之间的单点登录。

来张快乐简图

![jwt-cas](https://doc.k1r4ca.top/pic/jwt-cas.jpeg)

Sir,this way! [一篇文章彻底弄懂CAS实现SSO单点登录原理](https://www.cnblogs.com/wangsongbai/p/10299655.html)



## JWT

> 压轴重点，把JWT单独拉出来分析一下   *( 别问为什么了求你了(-_-） )*

JWT是Auth0提出的，以下信息主要来自[jwt.io](https://jwt.io/)

放一点JWT的缺点

1. **过期时间问题**：由于服务端不保存 Session 状态，因此无法在使用过程中废止某个 Token，或是更改 Token 的权限。也就是说，一旦 JWT 签发，在到期之前就会始终有效，除非服务端部署额外的逻辑。因此如果是浏览器端应用的话，使用 JWT 认证机制还需要设计一套 JWT 的主动更新删除的机制，这样就增加了系统的复杂性。
2. **安全性**：由于 JWT 的 Claims 是 Base64 编码的，并没有加密，因此 JWT 中不能存储敏感数据
3. **性能问题**：JWT 占用空间过大，Cookie 限制一般是 4k，可能会无法容纳，所以 JWT 一般放 LocalStorage 里面，并且用户在系统的每次 HTTP 请求都会把 JWT 携带在 Header 里面，HTTP 请求的 Header 可能比 Body 还要大。



接下来分析一下JWT的结构

标准形式下由三个部分构成，用`.`隔开；三部分如下

- Header 头部
- Payload 载荷
- Signature 签名

所以就像这样 `xxxxx.yyyyy.zzzzz`

### 头部

由类型`JWT`和加密形式构成

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

然后头部会被Base64URL加密

### 载荷

因为可以被直接解密，所以存放一些不敏感信息

```json
{
  "iss": "Jehoshaphat Tse",
  "iat": 1441593502,
  "exp": 1441594722,
  "aud": "www.example.com",
  "sub": "mrsingsing@example.com",
  "name": "John Doe",
  "admin": true
}
```

这里面的前五个字段都是由 JWT 的标准所定义的，所谓`Registered claims`

- `iss`：该 JWT 的签发者
- `sub`：该 JWT 所面向的用户
- `aud`：接收该 JWT 的一方
- `exp`（expires）：什么时候过期，这是 Unix 时间戳
- `iat`（issued at）：在什么时候签发的。

然后载荷会被Base64URL加密

### 签名

把头部和载荷加密拼接后用之前确定的加密方式和secret进行签名，拼接在最后

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```

> 这下搞明白之前Ek1ng问的伪造jwt的方式了，先~~通过什么奇奇怪怪的方法~~拿到secret，然后基于secret进行签名的构造

<br>

### 在线生成器

[官方工具](https://jwt.io/#debugger-io)  可在网站上直接生成JWT  ~~加密小玩具~~



<br><br>

> 没啥好说的，继续努力吧，本来就是什么都不会捏~

<br>



> 参考文章
>
> [HTTP基本认证 - 维基百科](https://zh.wikipedia.org/wiki/HTTP基本认证)
>
> [前端开发登录鉴权方案完全梳理 | mrsingsing](https://tsejx.github.io/blog/authentication/)
>
> [HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP)
>
> [Web 鉴权方案 | 阿菇の博客 ](http://ma5hr00m.top/posts/dev/usual-auth)
>
> [一篇文章彻底弄懂CAS实现SSO单点登录原理 - Hi，王松柏](https://www.cnblogs.com/wangsongbai/p/10299655.html)
>
> [JSON Web Tokens - jwt.io](https://jwt.io/)

