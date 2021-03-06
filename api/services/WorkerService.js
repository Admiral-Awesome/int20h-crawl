var token = "e35320780da19a9208bed8e427e852b825b1d668725e5997ce93f8de776484238e02ebedea9bb4019b6ed";
var request = require('request');
var signs = [];
var minutes = 1000;
var async = require('async');
var cron = require('node-cron');
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: '8mBaGQUK51w2ios4HgmuplvqJ',
    consumer_secret: 'MLojlQYK7SbcrqDfnQea67MggoMiGiwHgK9o2pEb4NZpI9736e',
    access_token_key: '712121743-i26KLjxHyFmCghnMbbVbHs94ln4hkuY30Dm2oBee',
    access_token_secret: 'UgsGufZuZRBlJxFJsTsInsp6NAKl02wRo72JOeylb5kBZ'
});


module.exports = {
    startCrawl: function () {
        // module.exports.startVk().then(function (data) {
        // console.log(signs)
        // {posts : []}

        Promise.all([module.exports.startTwitter(), module.exports.startVk()]).then(function () {
            request.post({ url: "http://api.hack.app/posts/store" , form: { "posts": signs } }, function (err, resp, body) {
                console.log({ "posts": signs });
                console.log(err);
                console.log(body)
            });
        }, function (err) {
            console.log(err);
        })

        // });
    },
    startTwitter: function () {
        return new Promise(function (resolve, reject) {
            sails.models.tags.find({}).exec(function (err, tags) {
                var asyncArr = [];

                function creteAsync(tag) {
                    return function (callback) {
                        module.exports.getTwitterPost(tag, callback);

                    }
                }
                for (var i = 0; i < tags.length; i++) {
                    asyncArr.push(creteAsync(tags[i].text));

                }
                console.log("here")
                async.parallel(asyncArr, function (err, res) {

                    resolve();
                })
            });
        });
    },
    getTwitterPost: function (tag, cb) {
        var startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - minutes);
        client.get('search/tweets', { q: '#' + tag }, function (error, tweets, response) {
            tweets = tweets.statuses;
            for (var i = 0; i < tweets.length;) {


                // if (tweets[i].text.length > 50 || tweets[i].text.length < 10) {

                //     body.splice(i, 1);
                //     continue;
                // }

                if (new Date(tweets[i].created_at) < startTime) {
                    tweets.splice(i, 1);
                    continue;
                }
                var tmpSign = {};
                tmpSign.user_id = tweets[i].user.id;
                tmpSign.time = new Date(tweets[i].created_at).getTime();
                tmpSign.likes = tweets[i].favorite_count;
                tmpSign.user = "@" + tweets[i].user.screen_name;
                tmpSign.network = "tw";
                tmpSign.tag = tag;

                tmpSign.text = module.exports.formatText(tweets[i].text);
                if (tmpSign.text.length > 10)
                    signs.push(tmpSign);
                i = i + 1;
            }
            // console.log(signs)
            cb();
        });
    },
    startVk: function () {
        return new Promise(function (resolve, reject) {
            sails.models.tags.find({}).exec(function (err, tags) {
                var asyncArr = [];

                function creteAsync(tag) {
                    return function (callback) {
                        module.exports.getVkPost(tag, callback);

                    }
                }
                for (var i = 0; i < tags.length; i++) {
                    asyncArr.push(creteAsync(tags[i].text));

                }
                async.parallel(asyncArr, function (err, res) {

                    resolve();
                })
            });
        });
    },
    getVkPost: function (tag, cb) {

        var startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - minutes);
        request("https://api.vk.com/method/newsfeed.search?" + "access_token=" + token + "&q=" + "%23" + tag + "&start_time=" + startTime.getTime() / 1000 + "&extended=1", function (err, resp, body) {

            body = JSON.parse(body)
            body = body.response;
            if (body.length > 1)
                body.splice(0, 1);

            for (var i = 0; i < body.length;) {


                if (body[i].group) {
                    body.splice(i, 1);

                    continue;
                }

                if (!body[i].text) {

                    body.splice(i, 1);
                    continue;

                }

                if (body[i].text.length > 50 || body[i].text.length < 10) {

                    body.splice(i, 1);
                    continue;
                }


                var tmpSign = {};
                tmpSign.user_id = body[i].owner_id;
                tmpSign.time = body[i].date;
                tmpSign.likes = body[i].likes.count;
                if (body[i].user)
                    tmpSign.user = body[i].user.first_name + " " + body[i].user.last_name;
                tmpSign.network = "vk";
                tmpSign.tag = tag;

                tmpSign.text = module.exports.formatText(body[i].text);
                if (tmpSign.text.length > 10)
                    signs.push(tmpSign)
                i = i + 1;
            }

            cb();

        });
    },
    formatText: function (text) {

        text = text.replace(/(<br>)/ig, '');
        text = text.replace(/#([^\\ ]*)/ig, '');
        text = text.trim();
        text = text.replace(/ +(?= )/g, '');
        return text;
    }
}

sails.on('lifted', function () {
    // cron.schedule('10 * * * * *', function () {
    WorkerService.startCrawl();
    // WorkerService.getTwitterPost('wdgniwg');
    // });

});