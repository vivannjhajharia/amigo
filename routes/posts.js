let mongoose = require('mongoose');

let PostSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    image: String,
    caption: String,
    likes: []
});

module.exports = mongoose.model('posts', PostSchema);