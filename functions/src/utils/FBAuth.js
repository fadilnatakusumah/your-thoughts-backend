const { admin, firestore } = require('./firestore')

const FBAuth = (req, res, next) => {
  const { authorization } = req.headers;
  let idToken;
  if (authorization && authorization.startsWith('Bearer ')) {
    idToken = authorization.split('Bearer ')[1];
  } else {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized',
    })
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      return firestore.doc(`/users/${decodedToken.uid}`).get()
        .then(doc => {
          if (!doc.exists) return res.status(404).json({
            success: false,
            message: 'No user found'
          })

          req.user = doc.data();
          return next()
        })
        .catch(err => res.status(500).json({
          success: false,
          message: 'Something wrong in FBAuth middleware',
          errors: err,
        }))
    })
    .catch(err => res.status(400).json({
      success: false,
      message: 'token expired',
      errors: err
    }));
}

module.exports = FBAuth;