const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI);

// create schema
const schema = new mongoose.Schema({
  idUser: String,
  username: String,
  description: String,
  duration: Number,
  exerciseDate: Date
});

var User = mongoose.model('User',schema);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// show a specific user log
app.get('/api/exercise/log',(req,res)=>{
  // show specific information about this user
  if(req.query.userId != null){
    User.find({idUser:req.query.userId},(err,data)=>{
      if(err){
        return err;
      }
      if(data[0]!== undefined){
        // show all data from specific user
        // should count the exercise count which is the size of the array
        let count = data.length;
        console.log(count);
        res.json(data);
        
        
      }else{
        res.send("user not found");
      }
    });
  }else{
    res.send("invalid user!");
  }
  
});

// show all users id and name
app.get('/api/exercise/users', (req,res)=>{
  let jsonArray = [];
  User.find({},(err,data)=>{
    if(err){
      return err;
    }
    // how to not show duplicates?
    for(let i =0; i < data.length; i++){
      let jsonObj = {username: data[i].username, _id: data[i].idUser}; 
      jsonArray.push(jsonObj);
    }
    let dups = [];
    let arrNoDuplicates = jsonArray.filter((el) =>{
        // If it is not a duplicate, return true
        if (dups.indexOf(el.username) == -1) {
          dups.push(el.username);
          return true;
        }
        return false;
    });
    
    res.send(arrNoDuplicates);
  });
 
  
});
// create a new user route
app.post('/api/exercise/new-user', (req, res) => {
  let name = req.body.username;
  let userNameId= Math.random().toString(36).substr(2, 9);
  if(name !== ''){
    var userTracker;
    // if name already exists show name and id
    // if it's a new name save in the db and show name and id
    User.find({username: name},(err,data)=>{
      if(err){
        return err;
      }
      if(data[0] == undefined){
        // creating a new user
        userTracker = new User({username: name, idUser: userNameId});
        // saving in the database
        userTracker.save((er,dt)=>{
          if(er){
            return er;
          }
        });
                                   
        res.json({username: name, _id: userTracker.idUser});                      
      }else{
        res.send('username already taken');
      }
      
    });
    
  }else{
    res.json({error: 'invalid username'});
  }
  
});

// add exercises route
app.post('/api/exercise/add', (req, res) => {
  // validate the  fields before updating
  let exDesc = req.body.description;
  let exDuration = req.body.duration;
  let exDate = req.body.date;
  // make sure id,desc, duration has a value
  if(exDesc == '' || exDuration== '' || req.body.userId == ''){
    res.send('Fields with * cannot be null!');
  }
  // if date is empty put Now
  if(exDate == ''){
    exDate = Date(Date.now());
  }
  
  // update the user
  User.findOne({idUser: req.body.userId},(err,data)=>{
    if(err){
      return err;
    }
    if(data == undefined){
      res.send('user does not exist');
    }
    // create user log
    User.create({username:data.username, idUser: data.idUser, description: exDesc,duration: exDuration, exerciseDate: exDate},(err,data)=>{
    if(err){
      return err;
    }
    res.json({username: data.username,_id: data.idUser,description: data.description, duration: data.duration, date: data.exerciseDate.toString()});
  });
  });
  
  
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'});
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || 'Internal Server Error';
  }
  res.status(errCode).type('txt')
    .send(errMessage);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
