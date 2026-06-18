const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const userModel = require('./models/user');
const postModel = require('./models/post');

const upload = require('./utils/multerconfig');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.set('view engine', 'ejs');



app.get('/',(req,res)=>{
    res.render('index');
});

app.get('/test',(req,res)=>{
    res.render('test');
});

app.get('/profile/upload',(req,res)=>{
    res.render('profileupload');
});

app.post('/upload',isLoggedIn,upload.single('image'),async (req,res)=>{
  let user = await userModel.findOne({email:req.user.email});
     user.profilepic = req.file.filename;
     await user.save();
    res.redirect('/profile');
})



app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/register',async (req,res)=>{
    let {username,email,age,password} = req.body;
   let user = await userModel.findOne({email:req.body.email});
   if(user) return res.status(500).send('User already exists');

   bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt,async(err,hash)=>{
        if(err) return res.status(500).send('Error hashing password');
        let createdUser = await userModel.create({
            username,
            email,
            age,
            password:hash
        });
          let token = jwt.sign({email:email,userid:createdUser._id},`${process.env.JWT_SECRET}`);
          res.cookie('token',token);
          res.send("registered");
    })
   })
});


app.get('/profile',isLoggedIn,async(req,res)=>{
    let gotuser = await userModel.findOne({email:req.user.email}).populate('posts');
   res.render('profile',{user:gotuser});
});

app.get('/like/:id',isLoggedIn,async(req,res)=>{
    let post = await postModel.findOne({_id:req.params.id});
   
    if(post.likes.indexOf(req.user.userid)=== -1){
    post.likes.push(req.user.userid);
   }
   else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
   }
   
    await post.save();
   res.redirect('/profile');
});


app.get('/edit/:id',isLoggedIn,async(req,res)=>{
    let post = await postModel.findOne({_id:req.params.id}).populate('user');
   res.render('edit',{post});
});

app.post('/update/:id',isLoggedIn,async(req,res)=>{
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content}).populate('user');
    res.redirect('/profile');
   
});

app.post('/posts',isLoggedIn,async(req,res)=>{
    let user = await userModel.findOne({email:req.user.email});
    let content = req.body.content;
    let post = await postModel.create({
        user:user._id,
        content
    })

    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
}); 

app.post('/login',async(req,res)=>{
    let {email,password} = req.body;
    let user = await userModel.findOne({email:req.body.email});
    if(!user) return res.status(500).send('User does not exist');
    bcrypt.compare(password,user.password,async (err,result)=>{
        if(err) return res.status(500).send('Error comparing password');
        if(!result) return res.status(500).send('Invalid password');
        let token = await jwt.sign({email:email,userid:user._id},`${process.env.JWT_SECRET}`);
        res.cookie('token',token);
        res.redirect('/profile');
    })
});

app.get('/logout',(req,res)=>{
    res.cookie('token','');
    res.redirect('/login');
});

function isLoggedIn(req,res,next){
    if(req.cookies.token==="") res.redirect('/login');
    else{
        jwt.verify(req.cookies.token,`${process.env.JWT_SECRET}`,(err,decoded)=>{
            if(err) return res.status(500).send('Invalid token');
                req.user = decoded;
                next();
        })
    }
}

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
});
