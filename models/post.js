const mongoose = require('mongoose');;
mongoose.connect('mongodb://127.0.0.1:27017/miniprojusers');

const postSchema = mongoose.Schema({
    user:{
    type : mongoose.Schema.Types.ObjectId,
    ref:'User'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    content:String,
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ]
});
module.exports = mongoose.model('Post',postSchema);