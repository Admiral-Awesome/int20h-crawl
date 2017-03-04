/**
 * TagsController
 *
 * @description :: Server-side logic for managing tags
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	setTags : function(req, res) {
        var tags = req.body.tags;
        console.log(req.body)
    sails.models.tags.destroy({}).exec(function() {
        for (var i = 0; i < tags.length; i++) {
            sails.models.tags.create({text : tags[i]}).exec(function(err, res) {
                console.log(res);
            })
        } 
        res.send({"status" : "success"});
    });
}
}

