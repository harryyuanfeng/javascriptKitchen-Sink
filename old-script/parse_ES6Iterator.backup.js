var Crawler = require("crawler");
var url = require('url');
var cache = require('memory-cache');

var _ = require("underscore");
var extractor = require('unfluff');
var ArticleParser = require('article-parser');

var Parse = require('parse/node');
Parse.initialize("111");
Parse.serverURL = 'http://localhost:1337/parse';
function go(domainKeyWord,staringUrl) {
    function log(s) {
        //console.log(s);
    }

    function extraLog(s) {
        //console.log(s);
    }


    var getAllItemsByClassName = {
        counter: 0,
        resultsArray: [],
        run: function (className, callback) {
            var self = this;
            var query = new Parse.Query(className);
            query.limit(1000);
            query.skip(1000 * this.counter);
            query.find().then(function (results) {
                if (results.length == 0) {
                    callback(self.resultsArray);
                    return;
                }
                for (var i = 0; i < results.length; i++) {
                    self.resultsArray.push(results[i]);
                }
                self.counter++;
                self.run(className, callback);
            })
        }
    }



    var leanextension = {
        getAllItemsByClassName: getAllItemsByClassName
    }

    //var c = ;

    var queueObj = {
        urlArray: [],
        patt: /(http:\/\/)/,
        queueingUrlNumber: 0,
        domainKeyWord: domainKeyWord,
        staringUrl: staringUrl,
        c: new Crawler({
            maxConnections: 10,
            forceUTF8: true,
            retries: 1,
            retryTimeout: 2000,
            timeout: 5000,
            onDrain: function () {
                console.log("a finished,no more queue");
            },
            callback: function (error, result, $) {
                queueObj.queueingUrlNumber--;
                try {
                    log("callback url is " + result.uri);
                    ArticleParser.extract(result.uri).then((article) => {
                        console.log(article.url)
                        //console.log(article);
                        saveToParseByCheckingTitle.save(article);
                    }).catch((err) => {
                        console.log(err);
                    });

                } catch (e) {

                }
                if (error) {
                    log("callback error");
                    log(error);
                }

                try {
                    var validUrl = 0;
                    var prepareToQueueArray = [];
                    $('a').each(function (index, a) {
                        var toQueueUrl = $(a).attr('href');
                        extraLog(toQueueUrl);
                        if (queueObj.patt.test(toQueueUrl) && toQueueUrl.indexOf(queueObj.domainKeyWord) != -1) {
                            prepareToQueueArray.push(toQueueUrl);
                        }
                    });

                    var queueThePrepareUrlArray = {
                        counter: 0,
                        run: function (theArray) {

                            var Article = Parse.Object.extend("Article");
                            var query = new Parse.Query(Article);
                            query.equalTo("url", theArray[queueThePrepareUrlArray.counter]);
                            query.find().then(function (results) {
                                log("counter is now " + queueThePrepareUrlArray.counter);
                                if (results.length > 0) {
                                    log(theArray[queueThePrepareUrlArray.counter] + " exist");
                                } else {
                                    validUrl++;
                                    console.log("queue counter now is = " + queueThePrepareUrlArray.counter);
                                    console.log("theArray length now is = " + theArray.length);
                                    //console.log("queue the url " + theArray);
                                    queueObj.c.queue(theArray[queueThePrepareUrlArray.counter]);
                                }
                                if (queueThePrepareUrlArray.counter > theArray.length - 1) {
                                    log("finish checking " + queueThePrepareUrlArray.counter);
                                    queueThePrepareUrlArray.counter = 0;
                                    return;
                                }
                                queueThePrepareUrlArray.counter++;
                                queueObj.queueingUrlNumber++;
                                queueThePrepareUrlArray.run(theArray);
                            })
                        }
                    }
                    queueThePrepareUrlArray.run(_.uniq(prepareToQueueArray));


                    log("valid url " + validUrl);
                    log("queueingUrlNumber url " + queueObj.queueingUrlNumber);

                } catch (e) {
                    log(e);
                }
            }
        })
    }



    var saveToParseByCheckingTitle = {
        check: function (title) {
            var Article = Parse.Object.extend("Article");
            var query = new Parse.Query(Article);
            query.equalTo("title", title);
            return query.find();
        },
        save: function (obj) {
            var TestObject = Parse.Object.extend("Article");
            var testObject = new TestObject();
            return saveToParseByCheckingTitle.check(obj.title).then(function (results) {
                if (results.length > 0) {

                } else {
                    testObject.save(obj).then(function (savedObj) {
                        console.log("saved " + obj.title)
                    }, function (error) {
                        log(error);
                    });
                }
            })
        }
    }





    // leanextension.getAllItemsByClassName.run("Article",function(result){
    //     log("cache " + result.length);
    //     for(var i = 0; i<result.length;i++){
    //         cache.put(result[i].get("url"), true);
    //     }

    // });

    setInterval(function () {
        getSimilarDomainObj.run();
    }, 1000 * 60)



    var getSimilarDomainObj = {
        run: function () {
            var query = new Parse.Query("Article");
            query.contains("url", queueObj.domainKeyWord);
            query.find().then(function (result) {
                var sample = _.sample(result, 10);
                for (var k = 0; k < sample.length; k++) {
                    console.log(sample[k].get("url"));
                    queueObj.c.queue(sample[k].get("url"));
                }
            })
        }
    }
    getSimilarDomainObj.run();
    queueObj.c.queue(queueObj.staringUrl);

}


new go("http://ent.huanqiu.com/","http://ent.huanqiu.com/");



