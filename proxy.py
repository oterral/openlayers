
import os.path
import urllib2
from httplib2 import Http
from bottle import request, response,route, run, abort
from bottle import static_file, HTTPError

@route('/proxy')
def hello():
    url = urllib2.unquote(request.GET.get('url'))
    print 'url=', url
    http = Http(disable_ssl_certificate_validation=True)
    h = dict(request.headers)
    h.pop("Host", h)
    try:
        (resp, content) = http.request(url)
    except:
        raise HTTPError(502, "Bad Gateway")

    ct = resp['content-type']

    response.content_type = ct
    
    if resp.status != 200:
        abort(resp.status)
   
    
    return content


@route('/<filepath:path>')
def server_static(filepath):
    print filepath
    root = os.path.join(os.path.dirname(os.path.realpath(__file__)), '')
    print root
    return static_file(filepath, root= root)



run(host='192.168.2.112', port=8000, debug=True)

