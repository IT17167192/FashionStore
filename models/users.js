const mongoose = require('mongoose');
const crypto = require('crypto');
const uuidv1 = require('uuid/v1');
const {ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxLength: 32
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    hash_password: {
        type: String,
        required: true
    },
    address1: {
        type: String
    },
    address2: {
        type: String
    },
    town: {
        type: String
    },
    postal_code: {
        type: String
    },
    mobile: {
        type: String
    },
    description: {
        type: String,
        trim: true
    },
    //field to add cart items
    product: [{
        type: ObjectId,
        ref: 'Product',
        required: false
    }],
    //field to add wishlist items
    wishlist: [{
        type: ObjectId,
        ref: 'Product',
        required: false
    }],
    salt: String,
    role: {
        type: String,
        default: 0
    },
    state: {
        type: String,
        default: '1'
    },
    history: {
        type: Array,
        default: []
    },
    resetLink: {
        type: String,
        default: ''
    }
}, {timestamps: true});

//virtual field
userSchema.virtual('password')
    .set(function (password) {
        this._password = password;
        this.salt = uuidv1();
        this.hash_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

userSchema.methods = {
    auth: function(password){
        return this.encryptPassword(password) === this.hash_password;
    },
    encryptPassword : function (password) {
        if(!password) return '';
        try{
            return crypto.createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');
        }catch(err){
            return "";
        }
    }
}

module.exports = mongoose.model("User", userSchema);
