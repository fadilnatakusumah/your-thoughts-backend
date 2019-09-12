const router = require('express').Router();

// import middleware FBAuth
const FBAuth = require('../utils/FBAuth');

// import controllers
const {
    // thoughts
    getAllThoughts,
    getAllFollowingThoughts,
    createThought,
    updateThought,
    deleteThought,

    // like/unlike
    likeThought,
    unlikeThought,

    // comments
    createCommentOnThought,
    deleteCommentOnThought
} = require('../controllers/thoughts/thoughtsController');

// thoughts
router.get('/thoughts', getAllThoughts);
router.get('/thoughts/following', FBAuth, getAllFollowingThoughts);
router.post('/thought', FBAuth, createThought);
router.put('/thought/:thought_id', FBAuth, updateThought);
router.delete('/thought/:thought_id', FBAuth, deleteThought);

// like/unlike
router.get('/thought/:thought_id/like', FBAuth, likeThought);
router.get('/thought/:thought_id/unlike', FBAuth, unlikeThought);

// comments
router.post('/thought/:thought_id/comment', FBAuth, createCommentOnThought);
router.delete('/thought/:thought_id/comment', FBAuth, deleteCommentOnThought);

module.exports = router;