const router = require('express').Router();

// import FBAuth middleware
const FBAuth = require('../utils/FBAuth');
// import controllers
const {
    signup, signin,
    getUserProfile,
    getUserDetails,
    uploadImage
} = require('../controllers/users/usersController');

// auth routes
router.post('/signup', signup);
router.post('/signin', signin);

router.get('/profile', FBAuth, getUserProfile);
router.get('/user/:user_id', getUserDetails);
router.post('/user/:user_id/image', FBAuth, uploadImage);


module.exports = router;