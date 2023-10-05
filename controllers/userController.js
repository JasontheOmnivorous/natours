const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

// route handlers/controllers for users
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: 'success',
        totalUsers: users.length,
        data: {
            users
        }
    })
});

exports.getUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined."
    })
}

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined."
    })
}

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined."
    })
}

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return new AppError('Cannot find user.', 400);

    res.status(204).json({
        status: 'success',
        message: null
    })
});
