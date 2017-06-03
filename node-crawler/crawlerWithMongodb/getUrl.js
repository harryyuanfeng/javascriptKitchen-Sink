var Crawler = require("crawler");
var _ = require("underscore");
var ArticleParser = require('article-parser');
var jsdom = require('jsdom');
var url = require('url');
var exec = require('child_process').exec;

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert');

function log(s) {
    console.log(s);
}

function getDomain(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    } else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

MongoClient.connect("mongodb://localhost:27017/articledb", function(err, db) {
    if (err) {
        return console.dir(err);
    }
    var col = db.collection('Url');
    var o = { w: 1 };
    o.multi = true
    col.updateMany({ isArticle: { $exists: false } }, { $set: { isArticle: false } }, o, function(err, r) {
        col.updateMany({ isQueue: { $exists: false } }, { $set: { isQueue: false } }, o, function(err, r) {
            col.updateMany({ qualityPercentage: { $exists: false } }, { $set: { qualityPercentage: -1 } }, o, function(err, r) {
                if (err) {
                    console.log("updateMany error", err);
                }
                console.log("update result", r.result);
                startGetUrl();
            });
        });
    });
});

function startGetUrl() {
    MongoClient.connect("mongodb://localhost:27017/articledb", function(err, db) {
        if (err) {
            return console.dir(err);
        }
        var col = db.collection('Url');
        var c = new Crawler({
            maxConnections: 100,
            timeout: 15000,
            jQuery: jsdom,
            // This will be called for each crawled page
            callback: function(error, result, done) {
                done();
                try {
                    log(result.options.uri);

                    var $ = result.$;
                    $('a').each(function(index, a) {
                        var toQueueUrl = $(a).prop('href').split('#')[0];
                        var text = $(a).text().trim().replace(" ", "");
                        if (escape(text).indexOf("%u") < 0) {
                            //alert("没有包含中文");
                            //console.log('no chinese', text);
                        } else {
                            //alert("包含中文");
                            if (toQueueUrl.indexOf("http://") == 0) {
                                col.find({ title: text }).toArray(function(err, docs) {
                                    if (docs.length === 0) {
                                        console.log('title', text);
                                        col.insertOne({ url: toQueueUrl, title: text, titleLength: text.length, urlDomain: getDomain(toQueueUrl), isQueue: false, isArticle: false, qualityPercentage: -1 });
                                    }
                                })
                            }
                        }
                    })
                } catch (e) {

                }
            }
        })

        setInterval(function() {
            col.findOne({ isQueue: false }, function(err, docs) {

                if (docs && docs.url) {
                    log("going to queue" + docs.url);
                    c.queue(docs.url);
                    col.updateMany({ url: docs.url }, { $set: { isQueue: true } });
                }
            })
        }, 1000);
        c.queue("http://bbs.51.ca/forum.php");
        col.createIndex({ "url": 1 }, { unique: true });
        col.createIndex({ title: "hashed" });

    });

    setTimeout(function() {
        exec("forever restart getUrl.js", function(error, stdout, stderr) {
            if (error) {
                console.log(error);
                return;
            }
            if (stdout) {
                console.log(stdout);
            }
        });
    }, 10 * 60000);
}
