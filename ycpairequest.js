/*
 * @Author: harry
 * @Date:   2017-10-02 10:04:28
 * @Last Modified by:   harryfeng
 * @Last Modified time: 2017-10-02 12:40:03
 */

var request = require('request');

var Datastore = require('nedb'),
    db = new Datastore({
        filename: 'nedb_partner.db',
        autoload: true
    });


var headers = {
    'User-Agent': 'Dalvik/1.6.0 (Linux; U; Android 4.3; Samsung Galaxy S4 - 4.3 - API 18 - 1080x1920 Build/JLS36G)',
    'Host': 'service.ycpai.com'
};
var page = 1;


function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
    	console.log(JSON.parse(body).data);
        db.insert(JSON.parse(body).data, function(err, newDoc) {
            if (err) {
                return console.log(err);
            } else {
                setTimeout(function() {
                    go(callback)
                }, 2000);
            }

        });
    }
}

function go(callback) {

    db.count({}, function(err, count) {
        console.log("page", page);
        page = Math.round(count / 10) + 1;

        var dataString = 'platform=2&login_code=a7ff8f413bc5fce418adbc52d33aa926&user_id=326740&channel=&version=633&sort=1&page=' + page + '&role_type=0&industry=0&startup=0&age_range=0&state_id=0&city_id=0&';
        console.log("dataString", dataString);
        var options = {
            url: 'http://service.ycpai.com/project/find_project_partner',
            method: 'POST',
            json:true,
            headers: headers,
            body: {
            	_page:1
            }
        };

        request(options, callback);
    });
}

go(callback);