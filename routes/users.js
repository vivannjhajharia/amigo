let mongoose = require('mongoose');
let plm = require('passport-local-mongoose');
let url = process.env.MONGO_URI || 'mongodb+srv://Vivann:vj241005@cluster0.vxpux.mongodb.net/Amigo?retryWrites=true&w=majority'

mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(function () {
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
    type: String,
    default: ''
  },
  dp: {
    type: String,
    default: 'https://freepikpsd.com/wp-content/uploads/2019/10/default-profile-image-png-1-Transparent-Images.png'
  },
  resetToken: String,
  resestTime: String
});

UserSchema.plugin(plm);

module.exports = mongoose.model('user', UserSchema);