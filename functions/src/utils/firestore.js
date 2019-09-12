const admin = require('firebase-admin');
const { functionsKey } = require('../../secrets');

admin.initializeApp({
    credential: admin.credential.cert(functionsKey),
    databaseURL: "https://your-thoughts-project.firebaseio.com",
})

const firestore = admin.firestore();

module.exports = { firestore, admin }