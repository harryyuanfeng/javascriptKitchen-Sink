var request = require('request');
var md5 = require('md5');

var diff = require('deep-diff').diff;

//
var dbInfoA = {
    appId:"3SK2AEoHGRDYVJ2R89GPfe2L-gzGzoHsz",
    appKey:"MSku8mnEFRRIeg4DJqU6K0Ow",
    masterKey:"ExigflXqpOI9vLftJB56prnL"
};

// development
var dbInfoB = {
    appId:"OAsq3BaUejlty6HR5y6LtoOA-gzGzoHsz",
    appKey:"rY459mImPgBLwM4H78n3lbzI",
    masterKey:"plvu0fCSPGdW3KcsmzUpff5a"
};


function makeRequestOption(appId,appKey,masterKey){
    var sign = md5(Date.now() + masterKey)
    var signedTimeKey = sign + "," + Date.now() + "," + "master";
    var signedKey = sign + "," + "master";
    var options = {
        url: ' https://api.leancloud.cn/1.1/schemas',
        headers: {
            "X-LC-Id": appId,
            "X-LC-Key": masterKey + "," + "master"
        }
    };
    return options;
}


request(makeRequestOption(dbInfoA.appId,dbInfoA.appKey,dbInfoA.masterKey), function(error, response, body){
    if (!error && response.statusCode == 200) {
        var firstSchema = JSON.parse(body);
        request(makeRequestOption(dbInfoB.appId,dbInfoB.appKey,dbInfoB.masterKey), function(error, response, body){
            var secondSchema = JSON.parse(body);
            var differences = diff(firstSchema, secondSchema);
            console.log(differences);
        });

    } else {
        console.log(JSON.stringify(error));
        console.log(JSON.stringify(response));
    }
});