const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI);

// create schema
const schema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

var User = mongoose.model('User',schema);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// exercise log route
app.get('api/exercise/', (req,res)=>{
  res.send("showing log");
});
// create a new user route
app.post('/api/exercise/new-user', (req, res) => {
  let name = req.body.username;
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
        userTracker = new User({username: name})
        // saving in the database
        userTracker.save((er,dt)=>{
          if(er){
            return er;
          }
        });
                                   
        res.json({username: name, _id: userTracker.id});                      
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
  User.findOneAndUpdate({id: req.body.userId},(err,data)=>{
    if(err){
      return err;
    }
    console.log(data);
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
