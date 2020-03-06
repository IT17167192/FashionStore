const mongoose = require('mongoose');
const crypto = require('crypto');
const uuidv1 = require('uuid/v1');

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
    description: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    salt: String,
    role: {
        type: String,
        default: 0
    },
    history: {
        type: Array,
        default: []
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