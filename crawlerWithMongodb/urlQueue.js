/*
 * @Author: Harry Feng
 * @Date:   2017-11-09 12:59:43
 * @Last Modified by:   Harry Feng
 * @Last Modified time: 2017-11-10 16:25:13
 */
const Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert');
const express = require('express');
const queryString = require('query-string');
var bodyParser = require('body-parser');
var _ = require('underscore');


const app = express()
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false
}));
var db;
var col;
var urlArray = [];
var articleUrlArray = [];
var url = require('url');
var urlInsertingArray = [];

function connect(callback) {
    MongoClient.connect("mongodb://localhost:27017/articledb", {
        keepAlive: 3000000,
        connectTimeoutMS: 3000000,
        socketTimeoutMS: 3600000
    }, (err, database) => {
        if (err) {
            return err;
        } else {
            callback(database);
        }
    });
}
connect(function(database) {
    console.log('database', 'connected');
    db = database;
    col = db.collection('Url');
    getUrl(function(urls) {
        console.log('init url succeed')
        urlArray = urlArray.concat(urls);
    });

    getUrl(function(urls) {
        console.log(urls.length);
        articleUrlArray = articleUrlArray.concat(urls);
        console.log('init article url succeed')
    }, {
        isArticle: false
    });
});

function getUrl(callback, query) {
    var _query = query || {
        isQueue: false
    }
    col.find({
        isQueue: false
    }).limit(3000).toArray(function(err, docs) {
        if (err) {
            return console.log(err);
        } else {
            callback(docs);
        }
    })
}

function updateUrl(url, set) {
    var _set = set || {
        isQueue: true
    }
    col.updateMany({
        url: url
    }, {
        $set: _set
    }, function(err, r) {
        if (err) {
            return console.log('updateUrl err', err);
        } else {}
    });
}

setInterval(function() {
    if (urlArray <= 1000) {
        getUrl(function(urls) {
            urlArray = urlArray.concat(urls);
        });
    }
    if (articleUrlArray <= 1000) {
        getUrl(function(urls) {
            articleUrlArray = articleUrlArray.concat(urls);
        }, {
            isArticle: false
        });
    }
}, 10000);

app.get('/', (req, res) => {
    var resultUrl = urlArray.shift();
    if (resultUrl && resultUrl.url) {
        updateUrl(resultUrl.url);
        res.json(resultUrl)
    } else {
        res.json(true);
    }
})

app.get('/articleUrl', (req, res) => {
    var resultUrl = articleUrlArray.shift();
    if (resultUrl && resultUrl.url) {
        updateUrl(resultUrl.url, {
            isArticle: true
        });
        res.json(resultUrl)
    } else {
        res.json(true);
    }
})

app.post('/save', (req, res) => {
    var urlObj = req.body;
    if (urlObj) {
        var dataArray = JSON.parse(urlObj.data)
    }
    _.each(dataArray, function(element, index, list) {
        var objectId = new ObjectID().toString();
        element.id = objectId;
    });
    res.send(true);
    urlInsertingArray = urlInsertingArray.concat(dataArray);
    console.log('urlInsertingArray length ', urlInsertingArray.length);
    if (urlInsertingArray && urlInsertingArray.length > 1000) {
        col.insertMany(dataArray, {
            ordered: false
        }, function(err, r) {
            console.log('r.insertedCount', r.insertedCount);
            urlInsertingArray = [];
            console.log('udpate url', new Date());
            if (err) {
                console.log('udpate err', err, new Date());
            } else {
                console.log('inserted', new Date());
            }
        });
    }
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))