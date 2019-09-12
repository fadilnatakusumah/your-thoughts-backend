const { firestore, admin } = require('../../utils/firestore');
const { firebase } = require('../../utils/firebase');
const { firebaseKey } = require('../../../secrets');
const { signupValidators, signinValidators, isEmail } = require('../../utils/validators');

exports.signup = (req, res) => {
  const { isValid, errors } = signupValidators(req.body);
  if (!isValid) return res.status(400).json({
    success: false,
    message: 'form inputs not valid',
    errors
  })

  const { name, email, password, username } = req.body;

  // check if username already used
  firestore.collection('users').where('username', '==', username).get()
    .then(snapshot => {
      let users = []
      snapshot.forEach(user => users.push(user));
      if (users.length > 0) return res.status(400).json({
        success: false,
        message: 'success find username',
        errors: {
          general: 'Username already used, please choose other username'
        }
      })
    })
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to search username',
      errors: err
    }))

  let userDetailsPayload, idToken;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(async result => {
      idToken = await result.user.getIdToken();
      // create user in database
      userDetailsPayload = {
        name,
        username,
        email,
        password,
        image_url: "https://firebasestorage.googleapis.com/v0/b/your-thoughts-project.appspot.com/o/no-profile-image.jpg?alt=media",
        location: "",
        bio: "",
        id: result.user.uid,
        followers: [],
        following: [],
        created_at: new Date().toISOString(),
      }

      return firestore.doc(`/users/${result.user.uid}`).set(userDetailsPayload);
    })
    .then(() => res.json({
      success: true,
      message: 'success signup user',
      data: {
        token: idToken,
        ...userDetailsPayload
      },
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to create new user',
      errors: {
        general: err.message
      }
    }))
}

exports.signin = (req, res) => {
  let { isValid, errors } = signinValidators(req.body);
  if (!isValid) return res.status(400).json({
    success: false,
    message: 'form is not valid',
    errors,
  });

  const { username, password } = req.body;
  let idToken;
  if (isEmail(req.body.username)) {
    firebase.auth().signInWithEmailAndPassword(username, password)
      .then(async result => {
        idToken = await result.user.getIdToken();
        return firestore.doc(`/users/${result.user.uid}`).get()
      })
      .then(doc => res.json({
        success: true,
        message: 'success login user',
        data: {
          token: idToken,
          ...doc.data()
        }
      }))
      .catch(err => res.status(500).json({
        success: false,
        message: 'failed to sign in user',
        errors: err
      }))
  } else {
    // signin with username
    firestore.collection('users').where('username', '==', username).limit(1).get()
      .then(snapshot => {
        let getUser = [];
        snapshot.forEach(user => getUser.push(user.data()));
        if (getUser.length > 0) {
          // check if the password match
          if (password === getUser[0].password) {
            // if match then sign in for getting the token
            firebase.auth().signInWithEmailAndPassword(getUser[0].email, getUser[0].password)
              .then(async result => {
                idToken = await result.user.getIdToken();
                return firestore.doc(`/users/${result.user.uid}`).get()
              })
              .then(doc => res.json({
                success: true,
                message: 'success login user',
                data: {
                  token: idToken,
                  ...doc.data()
                }
              }))
              .catch(err => res.status(500).json({
                success: false,
                message: 'failed to sign in user',
                errors: err
              }))
          }
        }
      })
  }
}

// exports.signout = (req, res) => {

// }

exports.getAllUsers = (req, res) => {
  firestore.collection('users').get()
    .then(result => {
      res.json({
        success: true,
        message: 'success get all users',
        data: result
      })
    })
    .catch(err => res.status(500).json({
      success: false,
      message: 'fail get all users',
      errors: err
    }))
}

exports.getUserDetails = (req, res) => {
  const { user_id } = req.params;
  firestore.doc(`/users/${user_id}`).get()
    .then(doc => {
      if (!doc.exists) return res.status(404).json({
        success: false,
        message: 'user not found'
      })

      return res.json({
        success: false,
        message: 'success get user details',
        data: doc.data()
      })
    })
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to get user details'
    }))
}

exports.getUserProfile = (req, res) => res.json({
  success: true,
  message: 'success get user profile',
  data: req.user,
})

exports.updateUser = (req, res) => {
  const { user_id } = req.params;
  const getUserDetail = firestore.doc(`/users/${user_id}`);
  getUserDetail.get()
    .then(doc => {
      if (!doc.exists) return res.status(404).json({
        success: false,
        message: 'user not found'
      })

      if (doc.data().username !== req.user.username) return res.status(403).json({
        success: false,
        message: 'not authorized'
      })

      getUserDetail.update({ ...req.body })

      return res.json({
        success: false,
        message: 'success update user details',
        data: { ...doc.data(), ...req.body }
      })
    })
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to get user details',
      errors: err,
    }))
}



exports.uploadImage = async (req, res) => {
  if (req.user.id !== req.params.user_id) return res.status(403).json({
    success: false,
    message: 'not authorized'
  })

  const Busboy = require('busboy');
  const busboy = new Busboy({ headers: req.headers })
  const path = require('path');
  const fs = require('fs');
  const os = require('os');
  // first check if the files already exist. if exist we delete it
  // get all the files
  const [files] = await admin.storage().bucket(firebaseKey.storageBucket).getFiles();
  let getFileExtension;
  files.forEach(file => {
    // check if there's file with the username, get the extension
    if (file.name.includes(req.user.id)) {
      getFileExtension = file.name.split(req.user.id)[file.name.split(req.user.id).length - 1];
    }
  })
  // if theres's file, delete them
  if (getFileExtension) {
    await admin.storage().bucket(firebaseKey.storageBucket).file(`profile-images/${req.user.id}${getFileExtension}`).delete()
  }

  let imageFilename;
  let imageTobeUploaded = {};
  let imageUrl;

  busboy.on('file', (fieldname, file, filename, coding, mimetype) => {
    // console.log("coding", coding) '7bit'
    // console.log("fieldname", fieldname) = fieldname like 'file' or 'image'
    // console.log("file", file) 
    // console.log("filename", filename) = [user_id].extension
    // console.log("mimetype", mimetype) = image/jpeg

    if (mimetype !== 'image/jpeg' && mimetype !== 'image/jpg' && mimetype !== 'image/png') {
      return res.status(400).json({
        success: false,
        message: 'please just upload the supported format (JPG|JPEG|PNG)'
      })
    }

    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    // imageFilename = `${Math.round(Math.random() * 100000)}.${imageExtension}`;
    imageFilename = `${req.user.id}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFilename);
    imageTobeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
    // console.log("imageFilename", imageFilename)
    // console.log("imageExtension", imageExtension)
    // console.log("imageTobeUploaded", imageTobeUploaded)
    // console.log("filePath", filePath)
  });

  busboy.on('finish', () => {
    // admin.storage().bucket().setStorageClass;
    // const storageRef = firebase.storage
    // storageRef.child('profile-images/').put(imageTobeUploaded.filePath)
      admin.storage().bucket(firebaseKey.storageBucket).upload(`${imageTobeUploaded.filePath}`, {
        destination: `profile-images/${imageFilename}`,
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageTobeUploaded.mimetype,
          }
        }
      })
      .then(() => {
        imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseKey.storageBucket}/o/profile-images%2F${imageFilename}?alt=media`;
        return firestore.doc(`/users/${req.user.id}`).update({
          image_url: imageUrl 
        })
      })
      .then(() => res.json({
        success: true,
        message: `Image successfully updated`,
        data: {
          ...req.user,
          image_url: imageUrl
        }
      }))
      .catch((err) => res.status(500).json({
        success: false,
        errors: err,
        message: `failed when uploading profile picture`
      }))
  })
  busboy.end(req.rawBody)
}