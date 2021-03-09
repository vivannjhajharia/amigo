let mongoose = require('mongoose');

let PostSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialMedias'
    },
    image: String,
    caption: String
});

module.exports = mongoose.model('posts', PostSchema);