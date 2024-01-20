const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('./../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
} = require('./../controllers/authController');
// Routes
const router = express.Router(); // create mount router for users

// route chaining for users
router.route('/signup').post(signup);

router.route('/login').post(login);

router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:resetToken').patch(resetPassword);

router.route('/').get(getAllUsers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
