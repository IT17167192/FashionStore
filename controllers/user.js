const User = require('../models/user');

exports.getUserById = (req, res, next, id) => {
    User.findById(id).populate('product').exec((err, user) => {
        if (err || !user) {
            res.status(400).json({
                error: 'User not found!'
            });
        }

        req.profile = user;
        next();
    });
};

exports.removeItemById = (req, res) => {
    User.updateOne(
            {_id: req.profile._id},
            { $pull: {product: req.body._id} },
            { safe: true, multi:true }
        )
        .exec((err, user) => {
            if (err || !user) {
                res.status(400).json({
                    error: 'Unauthorized Action!'
                });
            }
        })
};

exports.read = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    return res.json(req.profile);
};

//method to update users using requests
exports.update = (req, res) => {
    let updateSet = {$set: {}, $addToSet: {}};  //add to set used to not to replace existing cart items

    if (req.body.name != null) {
        updateSet.$set.name = req.body.name
    }
    if (req.body.password != null) {
        updateSet.$set.password = req.body.password
    }
    if (req.body.email != null) {
        updateSet.$set.email = req.body.email
    }
    //adding products to the shopping cart
    if (req.body.product != null) {
        updateSet.$addToSet.product = req.body.product
    }

    User.findOneAndUpdate({_id: req.profile._id}, updateSet, {new: true}, (err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'Unauthorized Action!'
            })
        }

        user.hashed_password = undefined;
        user.salt = undefined;

        res.json(user);
    });
};
