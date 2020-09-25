const http = require("http");
const fs = require("fs");
const got = require("got");
const cheerio = require("cheerio");
const url = require("url");

http.createServer(runServer).listen(process.env.PORT || 8000)

async function runServer(req, res) {
    var ru = url.parse(req.url, true);
    var path = ru.pathname;
    var pathp = path.split("/").slice(1)
    if (ru.pathname == "/") {
        fs.readFile("./web-content/index.html", function(err, resp) {
            if (err) {
                res.writeHead(400, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                })
                res.end(err.code);
                return;
            }
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            })
            res.end(resp);
        })
    } else if (pathp[0] == "search") {
        fs.readFile("./web-content/search/index.html", function(err, resp) {
            if (err) {
                res.writeHead(400, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                })
                res.end(err.code);
                return;
            }
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            })
            res.end(resp);
        })
    } else if (pathp[0] == "scrape") {
        if (!pathp[1]) {
            res.writeHead(400, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            })
            var d = JSON.stringify({
                "err": {
                    "code": "invalidSite",
                    "message": "Please set a site to scrape."
                }
            })
            res.end(d);
            return;
        }
        if (!ru.query.query) {
            res.writeHead(400, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            })
            var d = JSON.stringify({
                "err": {
                    "code": "invalidQuery",
                    "message": "Please set a query."
                }
            })
            res.end(d);
            return;
        }
        var baseUrl = "https://html.duckduckgo.com/html/?q=";
        if (pathp[1] == "mixdrop") {var site = "site:mixdrop.co"}
        if (pathp[1] == "gounlimited") {var site = "site:gounlimited.to"}
        if (pathp[1] == "vidlox") {var site = "site:vidlox.me"}
        var q = ' "' + encodeURI(ru.query.query) + '"';
        var fUrl = baseUrl + site + q;
        got(fUrl, {
            headers: {
                "Host": "html.duckduckgo.com",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Cookie": "df=d",
                "Upgrade-Insecure-Requests": "1",
                "DNT": "1",
                "Cache-Control": "max-age=0"
            }
        }).then(function(response) {
            var $ = cheerio.load(response.body);
            var l = [];
            for (var c in $(".results .result .links_main .result__snippet")) {
                if ($(".results .result .links_main .result__a")[c].children) {
                    if (
                        $(".results .result .links_main .result__a")[c] &&
                        $(".results .result .links_main .result__snippet")[c].attribs &&
                        $(".results .result .links_main .result__snippet")[c].attribs.href !== undefined
                    ) {
                        if (pathp[1] == "mixdrop") {var ts = "MixDrop - Watch "}
                        if (pathp[1] == "gounlimited") {var ts = "Watch "}
                        if (pathp[1] == "vidlox") {var ts = "Watch "}
                        if (extractDdgTitle($(".results .result .links_main .result__a")[c].children).includes(ts)) {
                            var title = extractDdgTitle($(".results .result .links_main .result__a")[c].children).split(ts)[1].split(" ...")[0];
                            var link = $(".results .result .links_main .result__snippet")[c].attribs.href;
                            var json = {
                                "title": title,
                                "link": link
                            }
                            l.push(json);
                        }
                    }
                }
            }
            var fJ = JSON.stringify({
                "result_num": l.length,
                "results": l
            });
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            })
            res.end(fJ);
        }).catch(function(e) {
            var d = JSON.stringify({
                "err": {
                    "code": "requestFailed",
                    "message": "The request failed to complete.",
                    "response": e.response.body
                }
            })
            res.writeHead(400, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            })
            res.end(d);
            return;
        })
    } else {
        var ft = path.split(".")[path.split(".").length - 1];
        if (fs.existsSync("./web-content" + path)) {
            fs.readFile("./web-content" + path, function(err, resp) {
                if (err) {
                    res.end(err.code)
                } else {
                    if (ft == "js") {
                        res.writeHead(200, {
                            "Access-Control-Content-Origin": "*",
                            "Content-Type": "application/javascript"
                        })
                    } else if (ft == "html") {
                        res.writeHead(200, {
                            "Access-Control-Content-Origin": "*",
                            "Content-Type": "text/html"
                        })
                    } else if (ft == "css") {
                        res.writeHead(200, {
                            "Access-Control-Content-Origin": "*",
                            "Content-Type": "text/css"
                        })
                    } else if (ft == "png") {
                        res.writeHead(200, {
                            "Access-Control-Content-Origin": "*",
                            "Content-Type": "image/png"
                        })
                    } else {
                        res.writeHead(200, {
                            "Access-Control-Content-Origin": "*"
                        })
                    }
                   
                    res.end(resp);
                }
            })
        }
    }
}

function extractDdgTitle(string) {
    var result = "";
    for (var c in string) {
        if (string[c].type == "text") {
            var result = result + string[c].data;
        } else if (string[c].type == "tag") {
            if (string[c].name == "b") {
                for (var cc in string[c].children) {
                    var result = result + string[c].children[cc].data;
                }
            }
        }
    }
    return result;
}