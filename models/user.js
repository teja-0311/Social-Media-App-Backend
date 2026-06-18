const mongoose = require('mongoose');;
mongoose.connect('mongodb://127.0.0.1:27017/miniprojusers');

const userSchema = mongoose.Schema({
    username:String,
    name:String,
    email:String,
    password:String,
    age:Number,
    profilepic:{
        type:String,
        default:"images.png"
    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Post'
        }
    ]
})

module.exports = mongoose.model('User',userSchema);