const express = require('express');
const {getAllUsers, createUser, getUser, updateUser, deleteUser} = require('./../controllers/userController');
// Routes
const router = express.Router(); // create mount router for users   

// route chaining for users
router
   .route('/')
   .get(getAllUsers)
   .post(createUser);

router
   .route('/:id')
   .get(getUser)
   .patch(updateUser)
   .delete(deleteUser);

module.exports = router;

