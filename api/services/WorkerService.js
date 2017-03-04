var token = "e35320780da19a9208bed8e427e852b825b1d668725e5997ce93f8de776484238e02ebedea9bb4019b6ed";
var request = require('request');
var signs = [];
var minutes = 15;
var async = require('async');
var cron = require('node-cron');


module.exports = {
    startCrawl: function () {
        module.exports.startVk().then(function (data) {
            console.log(signs)
            // {posts : []}
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
        request("https://api.vk.com/method/newsfeed.search?" + "access_token=" + token + "&q=" + "%23" + tag + "&start_time=" + startTime.getTime()/1000 + "&extended=1", function (err, resp, body) {

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

                tmpSign.time = body[i].date;
                tmpSign.likes = body[i].likes.count;
                if (body[i].user)
                    tmpSign.user = body[i].user.first_name + " " + body[i].user.last_name;
                tmpSign.network = "vk";
                tmpSign.tags = [tag];

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
         text = text.replace(/ +(?= )/g,'');
        return text;
    }
}

sails.on('lifted', function () {
    // cron.schedule('10 * * * * *', function () {
        WorkerService.startCrawl();
    // });

});