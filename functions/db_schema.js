const schema_example = {
  users: [{
    name: "fadil",
    username: "fadilnatakusumah",
    email: "fadil.ntksmh@gmail.com",
    password: "123456",
    image_url: "www.sadasdasd.com/cat.png",
    location: "Indonesia",
    bio: "hahahah",
    id: "123123124123",
    followers: ['userId'],
    following: ['userId'],
    created_at: "asdsadad",
  }],
  thoughts: [{
    id:'adasdsa',
    body: "asdsadasdsad",
    user_id: "asdsadas",
    like_count: 0,
    comment_count: 0,
    created_at: "date",
    user_image: "url",
    username: ""
  }],
  comments : [{
    id: 'asdasd',
    body: '',
    user_id: '',
    thought_id: '',
    created_at: '',
  }],
  likes : [{
    id: '',
    user_id: '',
    thought_id: '',
    created_at: '',
  }],
  notifications: [{
    id:'',
    sender_id:'',
    reciever_id:'',
    thought_id:'',
    type: 'mention|like|comment',
    readed:'',
    created_at:''
  }]

}