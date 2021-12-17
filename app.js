/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const mongoose = require('mongoose');
const multer = require('multer');
const express = require('express');
const session = require('express-session');
// const MongoStore = require('connect-mongo');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});
const upload = multer({ storage });

mongoose.connect(`mongodb+srv://${process.env.DB_HOST}/${process.env.DB_NAME}`, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('connected', () => {
  console.log(`${chalk.cyanBright('[DATABASE]')} Connection successful`);
});

db.on('error', (err) => {
  console.log(`${chalk.cyanBright('[DATABASE]')} ${chalk.redBright('[ERROR]')} ${err.reason}`);
});

const UserSchema = mongoose.Schema({
  name: { type: String, default: '', required: true },
});
UserSchema.plugin(passportLocalMongoose, { usernameLowerCase: true });
const User = mongoose.model('User', UserSchema);

const ReportSchema = mongoose.Schema({
  latitude: { type: String, default: '', required: true },
  longitude: { type: String, default: '', required: true },
  location: { type: String, required: true },
  image: { type: String, default: '', required: true },
  status: { type: Number, default: 0 },
  userId: { type: String, default: '', required: true },
  username: { type: String, default: '', required: true },
});
const Report = mongoose.model('Report', ReportSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // store: MongoStore.create({
  //   client: db.getClient(),
  //   ttl: 30 * 24 * 60 * 60,
  // }),
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/assets', express.static('./public/assets'));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication
app.post('/register', (req, res) => {
  User.register(new User({
    username: req.body.username,
    name: req.body.name,
  }), req.body.password, (err, user) => {
    if (err) {
      console.log(`${chalk.greenBright('[SERVER]')} ${chalk.redBright('[ERROR]')} ${err.message}`);
      return res.send({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    }
    req.login(user, (error) => {
      if (error) {
        console.log(`${chalk.greenBright('[SERVER]')} ${chalk.redBright('[ERROR]')} ${error.message}`);
        return res.send({
          icon: 'error',
          title: 'Error',
          text: err.message,
        });
      }
      res.send({
        icon: 'success',
        title: 'Success',
        text: `Logged in as ${user.username}`,
      });
    });
  });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (user) {
      req.logIn(user, (error) => {
        if (error) {
          res.send({
            icon: 'error',
            title: 'Error',
            text: error.message,
          });
        }
        res.send({
          icon: 'success',
          title: 'Success',
          text: `Logged in as ${user.username}`,
        });
      });
    } else if (info) {
      res.send({
        icon: 'error',
        title: 'Error',
        text: info.message,
      });
    } else if (err) {
      res.send({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    }
  })(req, res, next);
});

app.post('/logout', (req, res) => {
  req.logout();
  res.send({
    icon: 'success',
    title: 'Success',
    text: 'Logged out',
  });
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.use((req, res, next) => {
  res.locals.data = { status: 'OK' };
  if (!req.user) {
    res.redirect('/login');
  } else {
    res.locals.user = req.user;
    next();
  }
});

app.get('/', (req, res) => {
  Report.find({}).exec((err, result) => {
    res.locals.reports = result;
    res.render('index');
  });
});

app.get('/leaderboard', (req, res) => {
  Report.find({}).exec((err, result) => {
    function groupBy(objectArray, property) {
      return objectArray.reduce((acc, obj) => {
        const key = obj[property];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj);
        return acc;
      }, {});
    }
    const groupedResults = groupBy(result, 'location');
    res.locals.corps = groupedResults;
    res.render('leaderboard');
  });
});

app.get('/map', (req, res) => {
  res.render('map');
});

app.get('/api/markers', (req, res) => {
  Report.find({}).exec((err, result) => {
    const markers = result.map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      title: r._id,
      infoWindow: {
        content: `<div style="text-align:center">
        <image src="data:image/png;base64, ${r.image}" height="50px">
        <br>
        <strong>ID #${r._id}</strong>
        <br>
        ${r.location}<br>
        ${r.latitude}, ${r.longitude}<br>
        Submitted by ${r.username}
        </div>`,
      },
    }));
    res.send(markers);
  });
});

app.get('/report', (req, res) => {
  res.render('form');
});

app.post('/upload', upload.single('fileupload'), (req, res) => {
  const thumb = fs.readFileSync(req.file.path, 'base64');
  Report.create({
    latitude: req.body.formlatitude,
    longitude: req.body.formlongitude,
    location: req.body.corp,
    image: thumb,
    userId: req.user._id,
    username: req.user.username,
  }, (err) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Report saved!');
      fs.unlinkSync(req.file.path);
      res.redirect('/');
    }
  });
});

app.get('*', (req, res) => {
  res.render('404');
});

app.listen(process.env.SERVER_PORT || 8080, () => {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  console.log(`${chalk.greenBright('[SERVER]')} Started listening on *:${process.env.SERVER_PORT || 8080}`);
});
