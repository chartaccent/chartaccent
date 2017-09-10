url = "https://fonts.googleapis.com/css?family=Roboto+Mono|Roboto:300,400,500,700"

import requests
import re
import base64
import json

res = requests.get(url)

re_url = r'url\((.*?)\)'

def ResolveFontAsBase64(m):
    print(m.group(1))
    res = requests.get(m.group(1))
    data = res.content
    dataurl = "data:font/ttf;base64," + str(base64.b64encode(data))
    return "url(%s)" % dataurl

code = re.sub(re_url, ResolveFontAsBase64, str(res.content))

with open("assets/css/roboto.css", "wb") as f:
    f.write(code.encode("utf8"))

with open("build/roboto.js", "wb") as f:
    f.write(("exports.CSSRoboto = %s" % json.dumps(code)).encode("utf8"))