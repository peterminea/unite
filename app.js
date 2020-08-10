'use strict';

const Message = require("./models/message");

//Basic declarations:
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf");
const fs = require("fs-extra");
const process = require("process");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const MongoClient = require("mongodb").MongoClient;
const BASE = process.env.BASE;
const URI = process.env.MONGODB_URI;

const cookieParser = require("cookie-parser");
//require('dotenv').config();
//const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";//The DB url is actually saved as an Environment letiable, it will be easier to use anywhere in the application that way.
//Syntax: process.env.MONGODB_URI

const app = express();
const server = http.createServer(app);
const socket = socketio(server);
const { deleteFileBody, } = require('./middleware/templates');
/*
 i18next
    .use(i18nextMiddleware.LanguageDetector)
    .use(Backend)
    .init({
      backend: {
        loadPath:  'public' + '/locales/{{lng}}/{{ns}}.json' //__dirname
      },
      debug: true,
      detection: {
        order: ['querystring', 'cookie'],
        caches: ['cookie']
      },
      preload: ['en', 'ro', 'it', 'de'],
      saveMissing: true,
      fallBackLng: ['en']
    });

app.use(i18nextMiddleware.handle(i18next));*/
mongoose.Promise = global.Promise;
mongoose.set("useCreateIndex", true);

const store = new MongoDBStore({
  uri: URI,
  collection: "sessions"
});

app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
//app.use("/public", express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, '..', "public")));
//app.use([/(.*)\.js$/, '/public'], express.static(__dirname + '/public'));
/*
const LanguageController = require('./controllers/languageController');
app.use(lingua(app, {
        defaultLocale: 'en',
        path: path.join(__dirname, 'public/locales/dev'),
        storageKey: 'lang',// http://domain.tld/?lang=de
        cookieOptions: {
            domain: '.domain.tld',    // to allow subdomains access to the same cookie, for instance
            path: '/',            // to restrict the language cookie to a path
            httpOnly: false,          // if you need access to this cookie from javascript on the client
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),  // expire in 1 day instead of 1 year
            secure: false              // for serving over https
        }
    }));*/

//router.get('/', LanguageController.list);

//Locals error handler:
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.use('/public', (req, res, next) => {
  if (!req.session || process.env.ENV != 'dev') {
    let result = req.url.match(/(.*)\.js$/)
    if(result) {
      return res.status(403).end('403 Forbidden')
    }
  }
  
  next();
});

// Session
app.use(cookieParser("26UNWwbu26FvXZTJQBkf45dLSV7gG9bx"));
app.use(
  session({
    secret: "26UNWwbu26FvXZTJQBkf45dLSV7gG9bx",
    resave: false,
    saveUninitialized: true,
    cookie: {
      //secure: true
      //, maxAge: 7200000//2 hours in milliseconds
    },
    store: store
  })
);


//app.use(csrf({ cookie: true }));
//Password Checking & Protecting
const csrfProtection = csrf();
app.use(csrfProtection);
app.use(require("flash")());
//app.use(require('connect-flash')());
//app.use(require('express-flash')());

app.use(function (req, res, next) {
  let token = req.csrfToken();
  res.cookie('XSRF-TOKEN', token);
  res.locals.csrfToken = token;
  next();
});

//Routes and their usage:
const homeRoutes = require("./routes/home");
const supplierRoutes = require("./routes/supplier");
const buyerRoutes = require("./routes/buyer");
const supervisorRoutes = require("./routes/supervisor");

app.use("/", homeRoutes);
app.use("/supplier", supplierRoutes);
app.use("/buyer", buyerRoutes);
app.use("/supervisor", supervisorRoutes);

//For chatting:
const port = 5000;
/*
const server2 = http2.createSecureServer({
  key: fs.readFileSync("localhost-privkey.pem"),
  cert: fs.readFileSync("localhost-cert.pem")
});

server2.on("error", err => console.error(err));

server2.on("stream", (stream, headers) => {
  // stream is a Duplex
  stream.respond({
    "content-type": "text/html",
    ":status": 200
  });
  stream.end("<h1>Hello World</h1>");
});

server2.listen(8443);*/

server.listen(port, () => {
  console.log("Connected to port: " + port + ".");
});

app.post("/messages", (req, res) => {
  let message = new Message(req.body);

  message.save((err) => {
    if (err) return res.sendStatus(500);
    socket.emit("message", req.body);
    res.sendStatus(200);
  });
});


const { socketMethods } = require("./middleware/socketMethods");

socket.on("connection", (sock) => {
  socketMethods(socket, sock);
});


//Upload files to DB & to Glitch:
const ObjectId = require("mongodb").ObjectId;
const uploadController = require("./controllers/upload");
const uploadAvatarController = require("./controllers/uploadAvatar");
const methodOverride = require("method-override");
const { upload, uploadExcel, uploadProdImage, uploadSingleFile, uploadMultipleFiles, uploadProductImage, uploadExcelFile } = require('./middleware/uploads')
app.use(methodOverride("_method"));

app.post("/uploadfile", upload.single("single"), (req, res, next) => {
 uploadSingleFile(req, res, next);
});


app.post("/uploadProductImage", uploadProdImage.single("single"), (req, res, next) => {
  uploadProductImage(req, res, next);
});


app.post("/uploadExcel", uploadExcel.single("single"), (req, res, next) => {
  uploadExcelFile(req, res, next);
});


//Uploading multiple files
app.post("/uploadmultiple", upload.array("multiple", 10), (req, res, next) => {
  uploadMultipleFiles(req, res, next);
});


//Alternate multiupload:
app.post("/multipleupload", uploadController.multipleUpload, (req, res, next) => {
  console.log(req.files);
  res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);


app.post("/avatarUpload", uploadAvatarController.avatarUpload, (req, res, next) => {
    console.log(req.files);
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);


app.post("/purchase", (req, res, next) => {
  completePurchase(req, res, next);
});


app.post("/deleteFile", function(req, res, next) {
  deleteFileBody(req, res);
});


app.post("/exists", function(req, res) {
  let exists = fs.existsSync(req.body.path);
  return res.json({ exists: (exists? true: false )});
});


let db;
if (1 == 2)
  MongoClient.connect(URI, { useUnifiedTopology: true }, async (err, client) => {
    if (err) {
      console.error(err.message);
      throw err;
    }

    db = client.db(BASE); //Right connection!
    process.on("uncaughtException", function(err) {
      console.error(err.message);
    });    
        
 //db.close();
  });

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then((result) => {
    return null;
  })
  .then(() => {
    //app.listen(5000);
  })
  .catch(console.error);