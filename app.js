const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const logger = require("morgan");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

//Middleware
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(
  require("express-session")({
    secret: "this is serious",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Mongo URI
const mongoURI = "mongodb://localhost/image_crud2";

// create connection
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true });

// SCHEMA SETUP
/* let workSchema = new mongoose.Schema({
    title: String,
    workLink1: String,
    workLink2: String,
    workLink3: String,
    description: String, 
    workUi: String,
    created: {type: Date, default: Date.now}
});
let WorkInfo = conn.model('WorkInfo', workSchema); */

let workInfoSchema = new mongoose.Schema({
  title: String,
  workLink1: String,
  workLink2: String,
  workLink3: String,
  description: String,
  workUi: String,
  created: { type: Date, default: Date.now }
});
let WorkInfo = conn.model("WorkInfo", workInfoSchema);

let personalInfoSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  tel1: String,
  tel2: String,
  email: String,
  h_Education: String
});
let PersonalInfo = conn.model("PersonalInfo", personalInfoSchema);

let socialMediaSchema = new mongoose.Schema({
  facebook: String,
  instagram: String,
  linkedin: String,
  twitter: String,
  youtube: String,
  github: String,
  tumblr: String,
  reddit: String,
  pinterest: String
});
let SocialMedia = conn.model("SocialMedia", socialMediaSchema);

let userSchema = new mongoose.Schema({
  username: String,
  password: String,
  personalInfo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonalInfo"
    }
  ],
  workInfo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkInfo"
    }
  ],
  socialMedia: socialMediaSchema,
  profile_pic: String,
  cv: String
});
userSchema.plugin(passportLocalMongoose);
let User = conn.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* User.create({
    username: 'dotman',
    description: 'ldklsds',
    profileImage: 'sosooss'
}, (err, user)=>{
    if (err){
        console.log(err);
    } else {
        console.log(user);
    }
}); */

/* Post.create({
    title: 'How to make risccaa',
    content: 'blah  bdbd blah'
}, (err, post) => {
    User.findOne({username: 'Israel'}, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            user.post.push(post);
            user.save((err, data) =>{
                if(err){
                    console.log(err);
                } else {
                    console.log(data);
                }
            });
        }
    });
}); */

/* User.findOne({username: 'webmaster'}).populate('uploads.file').exec((err, user) => {
    if (err){
        console.log(err);
    } else {
        console.log(user);
    }
});  */

// init gfs
let gfs;
conn.once("open", () => {
  // init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Create storge engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// AUTH ROUTES
app.get("/", (req, res) => {
  res.render("signup", { user: req.user });
});

app.get("/signup", (req, res) => {
  res.render("signup", { user: req.user });
});

app.post("/signup", (req, res) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        return res.render("signup", { user: req.user });
      }
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secret");
      });
    }
  );
});

app.get("/login", (req, res) => {
  res.render("login", { user: req.user });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login"
  }),
  function (req, res) { }
);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//Auth routes ends here
//================================

// upload personal profile
// GET /profile
// gets the form to upload personal profile
app.get("/profile", isLoggedIn, (req, res) => {
  User.findOne({ username: req.user.username })
    .populate("personalInfo")
    .exec((err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.render("profile", { user: user });
      }
    });
});

// POST /profile
// handles the personal profile data submitted from the form GET /profile
app.post("/profile", isLoggedIn, (req, res) => {
  PersonalInfo.create(
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      tel1: req.body.tel1,
      tel2: req.body.tel2,
      email: req.body.email,
      h_Education: req.body.heq
    },
    (err, personalInfo) => {
      if (err) {
        console.log(err);
      } else {
        User.findOne({ username: req.user.username }, (err, user) => {
          if (err) {
            console.log(err);
          } else {
            user.personalInfo.push(personalInfo);
            user.save((err, user) => {
              if (err) {
                console.log(err);
              } else {
                console.log(user);
                res.redirect("/secret");
              }
            });
          }
        });
      }
    }
  );
});

app.post("/upload-pp", isLoggedIn, upload.single("profilepic"), (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      user.profile_pic = req.file.filename;
      user.save((err, user) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/secret");
        }
      });
    }
  });
});
// PUT /update-pp
// find the intial one in the db and delete then put the new one
app.put("/update-pp", isLoggedIn, upload.single("profilepic"), (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      gfs.remove(
        { filename: user.profile_pic, root: "uploads" },
        (err, gridStore) => {
          if (err) {
            return res.status(404).json({ err: err });
          }
          console.log("i just removed it");
        }
      );
      user.profile_pic = req.file.filename;
      user.save((err, user) => {
        if (err) {
          console.log(err);
        } else {
          console.log(user);
          console.log("i deleted and updated");
          res.redirect("/secret");
        }
      });
    }
  });
});

// /GET /delete-pp
// delete the profile pic
app.delete("/delete-pp/:filename", isLoggedIn, (req, res) => {
  gfs.remove(
    { filename: req.params.filename, root: "uploads" },
    (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
      console.log("delete successful");
    }
  );
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      user.profile_pic = "";
      user.save((err, user) => {
        if (err) {
          console.log(err);
        } else {
          console.log(user);
          res.redirect("/secret");
        }
      });
    }
  });
});

app.get("/socialmedia", isLoggedIn, (req, res) => {
  User.findOne({ username: req.user.username })
    .populate("personalInfo")
    .populate("workInfo")
    .exec((err, user) => {
      if (err) {
        console.log(err);
      } else {
        console.log(user);
        res.render("socialmedia", { user: user });
      }
    });
});

app.post("/socialmedia", isLoggedIn, (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      user.socialMedia = {
        facebook: req.body.facebook,
        instagram: req.body.instagram,
        linkedin: req.body.linkedin,
        twitter: req.body.twitter,
        youtube: req.body.youtube,
        github: req.body.github,
        tumblr: req.body.tumblr,
        reddit: req.body.reddit,
        pinterest: req.body.pinterest
      };
      user.save((err, user) => {
        if (err) {
          console.log(err);
        } else {
          console.log(user.SocialMedia);
          res.redirect("/secret");
        }
      });
    }
  });
});

app.get("/secret", isLoggedIn, (req, res) => {
  User.findOne({ username: req.user.username })
    .populate("workInfo")
    .populate("personalInfo")
    .exec((err, user) => {
      if (err) {
        console.log(err);
      } else {
        console.log(user);
        res.render("portfolio", { user: user });
      }
    });
});

// GET /portfolio/new
// show the form to fill in new work.
app.get("/new", isLoggedIn, (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      console.log(user);
      res.render("new", { user: user });
    }
  });
});

// POST /new
// handle the data submitted from the form Get /new
app.post("/new", isLoggedIn, upload.single("workui"), (req, res) => {
  WorkInfo.create(
    {
      title: req.body.title,
      workLink1: req.body.worklink1,
      workLink2: req.body.worklink2,
      workLink3: req.body.worklink3,
      description: req.body.description,
      workUi: req.file.filename
    },
    (err, work) => {
      if (err) {
        console.log(err);
      } else {
        User.findOne({ username: req.user.username }, (err, user) => {
          if (err) {
            console.log(err);
          } else {
            user.workInfo.push(work._id);
            user.save((err, user) => {
              if (err) {
                console.log(err);
              } else {
                console.log(user);
                res.redirect('/secret')
              }
            });
          }
        });
      }
    }
  );
});

// @route POST /upload
// @desc uploads file to db
app.post("/upload", upload.single("profile-image"), (req, res) => {

  User.create({
    username: req.body.username,
    description: req.body.description,
    profileImage: gfs.file
  }, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      console.log(user);
    }
  });
  res.redirect('/');
});

// @route GET /files
// @desc display all files in json
app.get("/files", (req, res) => {
  gfs.files.find().toArray(function (err, files) {
    // check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "NO files found"
      });
    }
    // files exist
    res.json(files);
  });
});

// @route GET /files/:filename
// @desc display a single file object
app.get("/files/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "file does not exist"
      });
    }
    //file exist
    res.json(file);
  });
});

// @route GET /image/:filename
// @desc display all files in json
app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "file does not exist"
      });
    }
    // check if image
    if (file.contentType === "image/jpeg" || file.contentType === "img/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image"
      });
    }
  });
});

// @route DELETE /files/:id
// @ desc Delete file
app.delete("/files/:id", (req, res) => {
  gfs.remove({ _id: req.params.id, root: "uploads" }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
    res.redirect("/");
  });
});

// ===
//SHOW PAGE
//===
app.get("/portfolio/:id", isLoggedIn, (req, res) => {
  WorkInfo.findById(req.params.id, (err, work) => {
    if (err) {
      console.log(err);
    } else {
      console.log(work);
      res.render("show", { user: req.user, work: work });
    }
  });
});


app.put('/edit/:id/ui', isLoggedIn, upload.single('workui'), (req, res) => {
  WorkInfo.findById(req.params.id, (err, work) => {
    if (err) {
      console.log(err);
    } else if (work.workUI) {
      gfs.remove({ _id: work.workUi, root: 'uploads' }, (err, gridStore) => {
        if (err) {
          console.log(err);
          return res.status(404).json({ err: err });
        }

      });
    }
    console.log('i removed a work ui from db');
    work.workUi = req.file.filename;
    work.save((err, work) => {
      if (err) {
        console.log(err);
      } else {
        console.log('i uploaded, i removed initial, and i saved, now i render you show');
        res.redirect('/secret');
      }
    });
  });
});

app.delete('/:id/work', isLoggedIn, (req, res) => {
  WorkInfo.findById(req.params.id, (err, work) => {
    if (err) {
      console.log(err);
    } else {
      if (work.workUi) {
        gfs.remove({ filename: work.workUi, root: 'uploads' }, (err, gridStore) => {
          if (err) {
            console.log(err);
          }
          console.log('file removed from uploads throug gfs');
        });
      }
    }
  })
  WorkInfo.findByIdAndDelete(req.params.id, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('i totally removed the work from the db');
      res.redirect('/secret')
    }
  });

});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

const port = 3000;

app.listen(port, () => {
  console.log("server started on port " + port);
});
