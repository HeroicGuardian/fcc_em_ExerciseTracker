require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var exerciseSchema = new mongoose.Schema
(
  {
    description: String,
    duration: Number,
    date: String,
    _raw_date: Date,
    _user_id: String
  }
);

var exerciseModel = mongoose.model("exerciseModel", exerciseSchema);

var userSchema = new mongoose.Schema
(
  {
    username: String,
  }
);

var userModel = mongoose.model("userModel", userSchema);

app.post('/api/users', function (req, res)
{
  var newUser = new userModel({ username: req.body.username });
  newUser.save();
  res.json(newUser);
});

app.get('/api/users', async function (req, res)
{
  var allUsers = await userModel.find().exec();
  res.send(allUsers);
});

app.post('/api/users/:_id/exercises', async function (req, res)
{
  if (!req.body.description || !req.body.duration)
  {
    res.json({ error: '"description" and "duration" are required fields.' });
  }
  else
  {
    var postDate = new Date();

    if (req.body.date)
    {
      postDate = new Date(req.body.date);
    }

    var postDateString = postDate.toDateString();
    var userWhoPosted = await userModel.findOne({ _id: req.params._id }).exec();
    var newExerciseObject = { description: req.body.description, duration: parseInt(req.body.duration), date: postDateString, _raw_date: postDate, _user_id: req.params._id };
    var newExercise = new exerciseModel(newExerciseObject);
    newExercise.save();

    var combinedObjects = { username: userWhoPosted.username, description: req.body.description, duration: parseInt(req.body.duration), date: postDateString, _id: req.params._id };
    res.json(combinedObjects);
  }
});

app.get('/api/users/:_id/logs', async function (req, res)
{
  var userToGet = await userModel.findOne({ _id: req.params._id }).exec();
  var userExercises = [];

  if (req.query.from && req.query.to && req.query.limit)
  {
    userExercises = await exerciseModel.find({ _user_id: req.params._id, _raw_date: { $gte: new Date(req.query.from), $lte: new Date(req.query.to) } }, 'description duration date -_id').limit(req.query.limit).exec();
  }
  else if (req.query.from && req.query.to)
  {
    userExercises = await exerciseModel.find({ _user_id: req.params._id, _raw_date: { $gte: new Date(req.query.from), $lte: new Date(req.query.to) } }, 'description duration date -_id').exec();
  }
  else if (req.query.limit)
  {
    userExercises = await exerciseModel.find({ _user_id: req.params._id }, 'description duration date -_id').limit(req.query.limit).exec();
  }
  else
  {
    userExercises = await exerciseModel.find({ _user_id: req.params._id }, 'description duration date -_id').exec();
  }

  var userLog = { username: userToGet.username, count: userExercises.length, _id: req.params._id, log: userExercises };
  res.json(userLog);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})