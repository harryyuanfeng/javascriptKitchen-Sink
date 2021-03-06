var Crawler = require("crawler");
var url = require('url');
var jsdom = require('jsdom');
var _ = require("underscore");

var Parse = require('parse/node');
Parse.initialize("111");
Parse.serverURL = 'http://localhost:1337/parse';
var domainList = require("./domainList");


var removeDuplicate = {
    identifier:_.sample(["a","b","c","d","e","f","g","h","i"]),
    columna:"url",
    className:"Qurl",
    countUnCheckUrl:function(){
        var Article = Parse.Object.extend(removeDuplicate.className);
        var query = new Parse.Query(Article);
        //query.notEqualTo("isChecked", removeDuplicate.identifier);
        query.doesNotExist("isChecked");
        query.count().then(function(results){
            console.log("uncheck count " + results);
        })
    },
    getNonCheckObj:function(options){
        var Article = Parse.Object.extend(removeDuplicate.className);
        var query = new Parse.Query(Article);

        query.doesNotExist("isChecked");
        if(options){
            if(options.block){
                //console.log("bloak");
                query.equalTo("block", options.block);
            }
            if(options.domain){
                //console.log("domain");
                query.contains("url",options.domain);
            }
        }
        return query.first();
    },
    getObjByTitle:function(title){
        var Article = Parse.Object.extend(removeDuplicate.className);
        var query = new Parse.Query(Article);
        query.equalTo(removeDuplicate.columna, title);
        return query.find();
    },
    checkTitle:function(options){
        removeDuplicate.getNonCheckObj(options).then(function(result){
            if(result == undefined){
                console.log("remvoe duplicated done");
                //removeDuplicate.identifier = _.sample(["a","b","c","d","e","f","g","h","i"]);
                setTimeout(function(){
                    removeDuplicate.checkTitle(options);
                },15000);
            }

            var title= result.get(removeDuplicate.columna);
            removeDuplicate.getObjByTitle(title).then(function(_result){
                if(_result.length > 1){
                    console.log("deleting " + _result[0].get(removeDuplicate.columna));
                    var indexToRemove = 0;
                    var numberToRemove = 1;
                    _result.splice(indexToRemove, numberToRemove);
                    return  Parse.Object.destroyAll(_result);

                }else{
                    _result[0].set("isChecked",removeDuplicate.identifier);
                    return _result[0].save();
                }
            }).then(function(__result){
                removeDuplicate.checkTitle(options);
            });
        })
    }
}

setInterval(function(){
    removeDuplicate.countUnCheckUrl();
},2000);


var domainArray = domainList();
console.log(domainArray);
for(var i = 0;i<domainArray.length; i++){
    new removeDuplicate.checkTitle({domain:domainArray[i]});
//    new removeDuplicate.checkTitle({domain:domainArray[i],block:2});
//    new removeDuplicate.checkTitle({domain:domainArray[i],block:3});
//    new removeDuplicate.checkTitle({domain:domainArray[i],block:4});
//    new removeDuplicate.checkTitle({domain:domainArray[i],block:5});
//    new removeDuplicate.checkTitle({domain:domainArray[i],block:6});
//    new removeDuplicate.checkTitle({domain:domainArray[i],block:7});
//    new removeDuplicate.checkTitle(domainArray[i],{block:2});
//    new removeDuplicate.checkTitle(domainArray[i],{block:3});
}
