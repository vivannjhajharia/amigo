let mongoose = require('mongoose');
let plm = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/Amigo')
.then(function(){
  console.log('Database connected');
});

let UserSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'posts'
  }],
  bio: {
    type: String, default: ''
  },
  dp: {
    type: String, default: 'https://freepikpsd.com/wp-content/uploads/2019/10/default-profile-image-png-1-Transparent-Images.png'
  }
});

UserSchema.plugin(plm);

module.exports = mongoose.model('SocialMedia', UserSchema);