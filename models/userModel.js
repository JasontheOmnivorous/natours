const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User name required.'],
        minlength: [5, 'User name must be longer than or equal to 10 characters.'],
        maxlength: [20, 'User name must be shorter than or equal to 20 characters.']
    },
    email: {
        type: String,
        required: [true, 'Email required.'],
        unique: [true, 'Email must be unique.'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valida email.']
    },
    photo: String,
    password: {
        type: String,
        required: [true, 'Password required.'],
        minlength: [10, 'Passoword should have at least 8 characters.'],
        select: false // should hide the password eventhough we encrypted it
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please reconfirm password.'],
        validate: {
            // this validation only works on create and save methods
            validator: function(val) {
                return val === this.password; // validate if the confirmed password is same with password
            },
            message: 'Passwords are not the same.'
        }
    }
});

// password encryption using bcrypt algorithm and mongoDB pre save hook
userSchema.pre('save', async function (next) {
    // if the password is not modified, we dont wanna encrypt it again
    if (!this.isModified('password')) return next();

    // hash (encrypt) the password before saving into DB
    // second arg is the measurement of CPU intensity to use in this operation
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; // delete the confirmed password after hashing the actual pasword
    next();
});

// Instance method
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    // we can't use this to point the current document because we've already hid it with select: false
    // bcrypt will calculate and compare these two if they are the same, regardless of they're hash or not
    return await bcrypt.compare(candidatePassword, userPassword);
}

module.exports = mongoose.model('User', userSchema);