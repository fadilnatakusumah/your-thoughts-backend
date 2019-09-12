const { firestore } = require('../../utils/firestore');

exports.getAllThoughts = (req, res) => {
  firestore.collection('thoughts').orderBy('created_at', 'desc').get()
    .then(snapshot => {
      let thoughts = [];
      snapshot.docs.forEach(thought => {
        thoughts.push(thought.data())
      })
      res.json({
        success: true,
        message: 'success get all thoughts',
        data: thoughts
      })
    })
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to get all thoughts',
      errors: err
    }))
}

exports.getAllFollowingThoughts = (req, res) => {
  const { following } = req.user
  // console.log("FOLLOWING", JSON.stringify(following, null, 2))
  firestore.collection('thoughts').get()
    .then(result => {
      let data = [], filteredData = [];
      result.forEach(thought => data.push(thought.data()))
      // console.log("BEFOOOOORR ==========", JSON.stringify(data, null, 2))
      data.map(thought => {
        if (following.includes(thought.user_id)) {
          filteredData.push(thought)
        }
      })
      // console.log("AFFTERRR ==========", JSON.stringify(filteredData, null, 2))
      res.json({
        success: true,
        message: 'success get all following thoughts',
        data: filteredData
      })
    })
    .catch(err => res.status(500).json({
      message: 'failed to get all following thoughts',
      errors: err
    }))
}

exports.getOneThought = (req, res) => {
  const { thought_id } = req.params;
  firestore.doc(`/thoughts/${thought_id}`).get()
    .then(doc => res.json({
      success: true,
      message: 'success get a thought',
      data: doc.data()
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to get a thought',
      errors: err
    }))
}

exports.createThought = (req, res) => {
  const { body } = req.body;
  if (body.trim() === '') return res.status(400).json({
    success: false,
    message: `Thought's body must not be empty`
  })

  let payload = {
    body: body,
    user_id: req.user.id,
    like_count: 0,
    comment_count: 0,
    edited: false,
    user_image: req.user.image_url,
    username: req.user.username,
    created_at: new Date().toString(),
  }

  firestore.collection('thoughts').add({
    ...payload
  })
    .then(updated => {
      payload = { ...payload, id: updated.id };
      return updated.update({ id: updated.id })
    })
    .then(() => res.json({
      success: true,
      message: 'success create thougth',
      data: payload,
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to create thougth',
      errors: err,
    }))
}

exports.updateThought = (req, res) => {
  const { body } = req.body;
  if (body.trim() === '') {
    return res.status(400).json({
      success: false,
      message: `Thought's body must not be empty`
    })
  }

  const { thought_id } = req.params;
  firestore.doc(`/thoughts/${thought_id}`)
    .update({
      body: req.body.body,
      edited: true,
    })
    .then(() => firestore.doc(`/thoughts/${thought_id}`).get())
    .then(doc => res.json({
      success: true,
      message: 'success update thought',
      data: doc.data(),
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to update thought',
      errors: err
    }))
}

exports.deleteThought = (req, res) => {
  const { thought_id } = req.params;
  console.log(thought_id)
  const getThought = firestore.collection('thoughts').doc(thought_id);
  getThought.get()
    .then(doc => {
      if (!doc.exists) return res.status(404).json({
        success: false,
        message: 'thought not found'
      })

      if (doc.data().username !== req.user.username) return res.status(403).json({
        success: false,
        message: 'not authorized'
      })

      return getThought.delete();
    })
    .then(() => res.json({
      success: true,
      message: 'success deleting thought',
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to delete thought',
      errors: err
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to delete thought 2',
      errors: err
    }))
}

exports.likeThought = (req, res) => {
  const { thought_id } = req.params;
  const thoughtData = firestore.doc(`/thoughts/${thought_id}`);
  firestore.collection('likes').where('user_id', '==', req.user.id)
    .where('thought_id', '==', thought_id).limit(1).get()
    .then(collection => {
      if (collection.empty) return firestore.collection('likes').add({
        user_id: req.user.id,
        thought_id,
        created_at: new Date().toISOString(),
      })
      else {
        return res.status(400).json({
          success: false,
          message: 'You already like this thought'
        })
      }
    })
    .then(like => like.update({ id: like.id }))
    .then(() => thoughtData.get())
    .then(doc => thoughtData.update({ like_count: doc.data().like_count + 1 }))
    .then(() => res.json({
      success: true,
      message: 'success like a thought'
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to liking a thought',
      errors: err
    }))
}


exports.unlikeThought = (req, res) => {
  const { thought_id } = req.params;
  const thoughtData = firestore.doc(`/thoughts/${thought_id}`);
  const likeCollection = firestore.collection('likes').where('user_id', '==', req.user.id)
    .where('thought_id', '==', thought_id).limit(1);

  thoughtData.get()
    .then(doc => {
      if (doc.exists) {
        return likeCollection.get();
      }
      return res.status(400).json({
        success: false,
        message: 'thought been deleted'
      })
    })
    .then(querySnapshot => {
      if (querySnapshot.empty) return res.status(400).json({
        success: false,
        message: 'thought already not liked'
      })
      return firestore.doc(`/likes/${querySnapshot.docs[0].id}`).delete();
    })
    .then(() => thoughtData.get())
    .then(doc => thoughtData.update({
      like_count: doc.data() - 1
    }))
    .then(() => res.json({
      success: true,
      message: 'success unlike a thought'
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to unliking a thought',
      errors: err
    }))
}


exports.createCommentOnThought = (req, res) => {
  const { thought_id } = req.params;
  const { body } = req.body;

  if (body.trim() === '') return res.status(400).json({
    success: false,
    message: 'Comment must not be empty'
  })

  let commentPayload = {};
  const getThought = firestore.doc(`/thoughts/${thought_id}`);
  const getComment = firestore.collection(`comments`);

  getComment.add({
    body: body,
    user_id: req.user.id,
    thought_id,
    created_at: new Date().toISOString(),
  })
    .then(updated => {
      updated.update({
        id: updated.id
      });
      commentPayload.id = updated.id;
      return getThought.get()
    })
    .then(doc => getThought.update({ comment_count: doc.data().comment_count + 1 }))
    .then(() => firestore.doc(`/comments/${commentPayload.id}`).get())
    .then((doc) => res.json({
      success: true,
      message: 'success adding comment on thought',
      data: doc.data()
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to adding comment on thought',
      errors: err
    }))
}

exports.deleteCommentOnThought = (req, res) => {
  const { id } = req.user;
  const { thought_id } = req.params;
  const { comment_id } = req.body;

  const getComment = firestore.doc(`/comments/${comment_id}`);
  const getThought = firestore.doc(`/thoughts/${thought_id}`);

  getComment.get()
    .then(docComment => getThought.get()
      .then(docThought => {
        console.log("docComment.data().user_id ", docComment.data().user_id)
        console.log("docThought.data().user_id ", docThought.data().user_id)
        console.log("USER ID", id)
        if (docComment.data().user_id !== id && docThought.data().user_id !== id) {
          return res.status(403).json({
            success: false,
            message: 'not authorized'
          })
        }
        getComment.delete()
        return getThought.update({
          comment_count: docThought.data().comment_count - 1
        })
      })
      .catch(err => res.status(500).json({
        success: false,
        message: 'failed to delete a comment on thought',
        errors: err
      })))
    .then(() => res.json({
      success: true,
      message: 'success deleting comment on thought'
    }))
    .catch(err => res.status(500).json({
      success: false,
      message: 'failed to delete a comment on thought',
      errors: err
    }))


  // getComment
  //   .then(docComment => {
  //     return getThought.then(docThought => {
  //       if (docComment.data().user_id !== user_id && docThought.data().user_id !== user_id) {
  //         return res.status(403).json({
  //           success: false,
  //           message: 'not authorized'
  //         })
  //       }
  //     })
  //       .then(() => getComment.delete())
  //       .then(() => res.json({
  //         success: true,
  //         message: 'success deleting comment on thought'
  //       }))
  //       .catch(err => res.status(500).json({
  //         success: false,
  //         message: 'failed to delete a comment on thought',
  //         errors: err
  //       }))
  //   })
  //   .catch(err => res.status(500).json({
  //     success: false,
  //     message: 'failed to delete a comment on thought',
  //     errors: err
  //   }))
}
