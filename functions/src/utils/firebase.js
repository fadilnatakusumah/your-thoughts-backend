const firebase = require('firebase');
const { firebaseKey } = require('../../secrets')

firebase.initializeApp(firebaseKey);


module.exports = { firebase }