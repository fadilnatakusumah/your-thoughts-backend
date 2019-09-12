const functions = require('firebase-functions');
const { firestore } = require('./src/utils/firestore');
const cors = require('cors');
const bodyParser = require('body-parser');

// later maybe apply cors middleware
const morgan = require('morgan');
const app = require('express')();

// middlewares
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cors())

// routes
const thoughtsRoutes = require('./src/routes/thoughtsRoutes');
const usersRoutes = require('./src/routes/usersRoutes');

// use routes
app.use(thoughtsRoutes);
app.use(usersRoutes);

// rout



exports.api = functions.https.onRequest(app);

// watchers functions
exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
  .onCreate(snapshot => {
    return firestore.doc(`/thoughts/${snapshot.data().thought_id}`).get()
      .then(doc => {
        if (doc.exists && doc.data().user_id !== snapshot.data().user_id) {
          return firestore.doc(`/notifications/${snapshot.id}`).set({
            id: snapshot.id,
            sender_id: snapshot.data().user_id,
            reciever_id: doc.data().user_id,
            thought_id: doc.id,
            type: 'like',
            readed: false,
            created_at: new Date().toISOString(),
          })
        }
      })
      .catch(err => {
        console.log('thought might be deleted', err)
      })
  })

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
  .onDelete(snapshot => {
    return firestore.doc(`/notifications/${snapshot.id}`).delete()
      .catch(err => {
        console.log('there is problem when deleting notification on unlike', err)
      })
  })

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
  .onCreate(snapshot => {
    return firestore.doc(`/thoughts/${snapshot.data().thought_id}`).get()
      .then(doc => {
        if (doc.exists && doc.data().user_id !== snapshot.data().user_id) {
          return firestore.doc(`/notifications/${snapshot.id}`).set({
            id: snapshot.id,
            sender_id: snapshot.data().user_id,
            reciever_id: doc.data().user_id,
            thought_id: doc.id,
            type: 'comment',
            readed: false,
            created_at: new Date().toISOString(),
          })
        }
      })
  })

exports.deleteNotificationOnDeleteComment = functions.firestore.document('comments/{id}')
  .onDelete(snapshot => {
    return firestore.doc(`/notifications/${snapshot.id}`).delete()
      .catch(err => {
        console.log('there is problem when deleting notification on delete comment', err)
      })
  })


exports.onUpdateProfile = functions.firestore.document('users/{id}')
  .onUpdate(snapshot => {
    const batch = firestore.batch();
    // if user update on profile pict, then update all of thoughts
    if (snapshot.before.data().image_url !== snapshot.after.data().image_url) {
      return firestore.collection('thoughts').where('user_id', '==', snapshot.after.id).get()
        .then(collections => {
          collections.forEach(doc => {
            const thought = firestore.doc(`/thoughts/${doc.id}`);
            batch.update(thought, { user_image: snapshot.after.data().image_url })
          })
          return batch.commit();
        })
    }

    // if user update his username
    if (snapshot.before.data().username !== snapshot.after.data().username) {
      return firestore.collection('thoughts').where('user_id', '==', snapshot.after.id).get()
        .then(collections => {
          collections.forEach(doc => {
            const thought = firestore.doc(`/thoughts/${doc.id}`);
            batch.update(thought, { username: snapshot.after.data().username })
          })
          return batch.commit();
        })
    }
  })


// on thouhgt delete, delete all related data (likes/notifications/comments)

exports.onDeleteThought = functions.firestore.document('thoughts/{id}')
  .onDelete((snapshot, context) => {
    const batch = firestore.batch();
    const thought_id = context.params.thought_id
    return firestore.collection('comments').where('thought_id', '==', thought_id).get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          batch.delete(firestore.doc(`/comments/${doc.id}`))
        })
        return firestore.collection('likes').where('thought_id', '==', thought_id).get()
      })
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          batch.delete(firestore.doc(`/likes/${doc.id}`))
        })
        return firestore.collection('notifications').where('thought_id', '==', thought_id).get()
      })
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          batch.delete(firestore.doc(`/notifications/${doc.id}`))
        })
        return batch.commit()
      })
      .catch(err => {
        console.log('there is problem when deleting all related data with the thought', err)
      })

  })















// ================================EXAMPLE================================//

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });