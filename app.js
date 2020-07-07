//Basic declarations:
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const multer = require("multer");
const fs = require("fs-extra");
const fs2 = require("fs");
const dateformat = require("dateformat");
const { basicFormat, customFormat, normalFormat } = require('./middleware/dateConversions');
const process = require("process");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const server = http.createServer(app);
const socket = socketio(server);
const BadWords = require("bad-words");
const crypto = require("crypto");
const moment = require("moment");
const http2 = require("http2");

const BASE = process.env.BASE;
const URI = process.env.MONGODB_URI;
const MAX_PROD = process.env.SUP_MAX_PROD;

const stripeSecretKey = process.env.STRIPE_KEY_SECRET;
const stripePublicKey = process.env.STRIPE_KEY_PUBLIC;
const stripe = require("stripe")(stripeSecretKey);

//Classes:
const BidRequest = require("./models/bidRequest");
const BidStatus = require("./models/bidStatus");
const BidCancelReasonTitle = require("./models/bidCancelReasonTitle");
const Feedback = require("./models/feedback");
const FeedbackSubject = require("./models/feedbackSubject");
const Buyer = require("./models/buyer");
const Supplier = require("./models/supplier");
const Supervisor = require("./models/supervisor");
const AdminCancelReasonTitle = require("./models/adminCancelReasonTitle");
const UserCancelReasonTitle = require("./models/userCancelReasonTitle");
const Currency = require("./models/currency");
const Message = require("./models/message");
const Country = require("./models/country");
const Industry = require("./models/industry");
const Capability = require("./models/capability");
const ProductService = require("./models/productService");
const cookieParser = require("cookie-parser");
//require('dotenv').config();

//const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";//The DB url is actually saved as an Environment variable, it will be easier to use anywhere in the application that way.
//Syntax: process.env.MONGODB_URI

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

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.use(express.static(path.join(__dirname, '..', "public")));
//app.use([/(.*)\.js$/, '/public'], express.static(__dirname + '/public'));

app.use('/public', (req, res, next) => {
  console.log(req);
  if (!req.session || process.env.ENV != 'dev') {
    var result = req.url.match(/(.*)\.js$/)
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
// Password Checking & Protecting
const csrfProtection = csrf();
app.use(csrfProtection);
app.use(require("flash")());
//app.use(require('connect-flash')());
//app.use(require('express-flash')());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
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

//throw new Error();

app.post("/processBuyer", (req, res) => {
  MongoClient.connect(URI, { useUnifiedTopology: true }, function(err, db) {
    if (err) throw err;

    var dbo = db.db(BASE),
      myquery = { _id: req.body.id };
    dbo.collection("buyers").deleteOne(myquery, function(err, resp) {
      if (err) {
        return console.error(err.message);
      }

      db.close();
    });
  });
});

/*
function compareTimes(a, b) {
  if ( a.time < b.time ){
    return -1;
  }
  if ( a.time > b.time ){
    return 1;
  }
  return 0;
}*/

//Lambda variant: messages.sort((a,b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
app.get("/messages", (req, res) => {
  Message.find(
    {
      $or: [
        { from: req.query.from, to: req.query.to },
        { from: req.query.to, to: req.query.from }
      ]
    },
    (err, messages) => {
      if (err) {
        return console.error(err.message);
      }

      //messages.sort(compareTimes);
      messages.sort((a, b) => (a.time > b.time ? 1 : b.time > a.time ? -1 : 0));
      res.send(messages);
    }
  );
});

server.listen(port, () => {
  console.log("Connected to port: " + port + ".");
});

app.post("/messages", (req, res) => {
  var message = new Message(req.body);

  message.save(err => {
    if (err) return res.sendStatus(500);
    socket.emit("message", req.body);
    res.sendStatus(200);
  });
});

let count = 0;
const {
  generateMessage,
  generateSimpleMessage,
  generateLocationMessage
} = require("./middleware/chatMessages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./middleware/chatUsers");
//console.log(Date.now() + ' ' + new Date() + ' ' + new Date().getTime());

socket.on("connection", sock => {
  console.log("User connected!");
  sock.emit("countUpdated", count);

  sock.on("join", (obj, callback) => {
    console.log("New WebSocket Connection: " + obj.username);

    var { error, user } = addUser({
      id: sock.id,
      username: obj.username,
      room: obj.room
    }); //..options
    console.log(sock.id + " " + JSON.stringify(user) + " " + error);
    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }

    if (error) {
      return callback(error);
    }

    sock.join(user.room);
    var msg = generateSimpleMessage("Admin", "Welcome to the UNITE chat!");
    sock.emit("message", msg);
    var users = getUsersInRoom(user.room);
    console.log(users.length + " " + users[0].username);
    socket.to(user.room).emit("roomData", {
      room: user.room,
      users: users
    });

    msg = generateSimpleMessage(
      "Admin",
      "We have a new user, " + user.username + ", that has joined us in Chat!"
    );
    console.log(msg.username);
    sock.broadcast.to(user.room).emit("message", msg);

    callback();
  });

  sock.on("increment", () => {
    count++;
    //sock.emit('countUpdated', count);//Particularly
    socket.emit("countUpdated", count); //Globally
  });

  sock.on("disconnect", function() {
    console.log("User disconnected!");
    var user = removeUser(sock.id);
    console.log(JSON.stringify(user));
    if (user) {
      socket
        .to(user.room)
        .emit(
          "message",
          generateSimpleMessage("Admin", `${user.username} has just left us!`)
        );
      socket.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });

  sock.on("stopTyping", () => {
    sock.broadcast.emit("notifyStopTyping");
  });

  sock.on("sendMessage", function(msgData, callback) {
    //console.log(sock);
    var user = getUser(sock.id);

    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }

    msgData.time = new Date().getTime(); //dateformat(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT');

    sock.broadcast.emit("received", {
      message: msgData.message
    });

    const filter = new BadWords();
    if (filter.isProfane(msgData.message)) {
      return callback(
        console.log(
          "Please be careful with the words you use. Delivery failed. Thank you for understanding!"
        )
      );
    }

    var mesg = new Message(msgData);

    mesg.save(err => {
      if (err) {
        console.error(err.message);
        //flash('error', err.message);
        throw err;
      }
    });
    console.log("BAI VADIME");
    console.log(callback);
    socket
      .to(user.room)
      .emit("message", generateMessage(user.username, msgData));
    if (typeof callback !== "undefined") callback();
  });

  sock.on("sendLocation", (coords, callback) => {
    console.log(coords);
    var user = getUser(sock.id);
    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }

    socket
      .to(user.room)
      .emit(
        "locationMessage",
        generateLocationMessage(
          user.username,
          `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
        )
      );
    console.log(
      "https://www.google.com/maps?q=" +
        coords.latitude +
        "," +
        coords.longitude +
        ""
    );
    callback();
  });

  sock.on("typing", data => {
    var user = getUser(sock.id);
    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }
    sock.broadcast
      .to(user.room)
      .emit(
        "notifyTyping",
        generateSimpleMessage("Admin", `${user.username} is typing...`)
      );
  });
});

//Buyers should load a Catalog of Products by clicking on a button in their Index page:
app.get("/loadProductsCatalog", (req, res) => {
  ProductService.find({}, async (err, products) => {
    if (!products || !products.length) {
      return false;
    }

    var catalogItems = [];

    for (var i in products) {
      var supId = products[i].supplier;

      await Supplier.findOne({ _id: supId }, function(err, obj) {
        if (err) {
          console.log(err.message);
          throw err;
        }

        if (obj)
          catalogItems.push({
            productName: products[i].productName,
            price: products[i].price,
            amount: products[i].amount,
            totalPrice: products[i].totalPrice,
            productImage: products[i].productImage,
            currency: products[i].currency,
            supplier: obj.companyName
          });
      });
    }

    catalogItems.sort(function(a, b) {
      return a.supplier.localeCompare(b.supplier);
    });

    //console.log(JSON.stringify(catalogItems));
    res.json(catalogItems);
  });
});

//Upload files to DB & to Glitch:
const ObjectId = require("mongodb").ObjectId;
const uploadController = require("./controllers/upload");
const uploadAvatarController = require("./controllers/uploadAvatar");

var methodOverride = require("method-override");
app.use(methodOverride("_method"));

var extArray = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".pdf", ".txt", ".doc", ".docx", ".rtf"],
  prodImageArray = ['.png', '.jpg', '.jpeg'],
  excelArray = [".xls", ".xlsx"];

//Upload files to Glitch:
var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("${__dirname}/../public/uploads"));
    //callback(null, 'public/uploads/');
  },
  filename: function(req, file, callback) {
    // + path.extname(file.originalname)
    var date = dateformat(new Date(), "dddd-mmmm-dS-yyyy-h:MM:ss-TT"); //Date.now()
    var date2 = moment(new Date().getTime()).format("HH:mm:ss:a");
    callback(null, file.fieldname + "-" + date2 + "-" + file.originalname); //The name itself.
  }
});


var upload = multer({
  storage: storage,
  fileFilter: function(req, file, callback) {
    var ext = path.extname(file.originalname);
    var isItIn = false;

    for (var i in extArray)
      if (ext.toLowerCase() == extArray[i].toLowerCase()) {
        isItIn = true;
        break;
      }
    if (!isItIn) {
      return callback(new Error("Extension forbidden!"));
    }

    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 //1 MB
  }
});


var uploadExcel = multer({
  storage: storage,
  fileFilter: function(req, file, callback) {
    var ext = path.extname(file.originalname);
    var isItIn = false;

    for (var i in excelArray)
      if (ext.toLowerCase() == excelArray[i].toLowerCase()) {
        isItIn = true;
        break;
      }
    if (!isItIn) {
      return callback(new Error("Please upload an Excel file!"));
    }

    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 //1 MB
  }
});


var prodImageStorage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("${__dirname}/../public/productImages"));
    //callback(null, 'public/uploads/');
  },
  filename: function(req, file, callback) {
    // + path.extname(file.originalname)
    var date = dateformat(new Date(), "dddd-mmmm-dS-yyyy-h:MM:ss-TT"); //Date.now()
    var date2 = moment(new Date().getTime()).format("HH:mm:ss:a");
    callback(null, file.originalname.substring(file.originalname.lastIndexOf('.')+1) + "-" + date + "-" + file.originalname); //The name itself.
  }
});


var uploadProdImage = multer({
  storage: prodImageStorage,
  fileFilter: function(req, file, callback) {
    var ext = path.extname(file.originalname);
    var isItIn = false;

    for (var i in prodImageArray)
      if (ext.toLowerCase() == prodImageArray[i].toLowerCase()) {
        isItIn = true;
        break;
      }
    if (!isItIn) {
      return callback(new Error("Please upload an image file!"));
    }

    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 //1 MB
  }
});


app.post("/uploadfile", upload.single("single"), (req, res, next) => {
  const file = req.file;
  console.log(file); //Can we parse its content here or not?
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
  return true;
  
  var tmp_path = req.file.path;
  var target_path = "custom/uploads/" + req.file.originalname;
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on("end", function() {
    res.render("complete");
  });
  src.on("error", function(err) {
    res.render("error");
  });
});


app.post("/uploadProductImage", uploadProdImage.single("single"), (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
});


var xlsx = require("node-xlsx");
app.post("/uploadExcel", uploadExcel.single("single"), (req, res, next) => {
  const file = req.file;

  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  var obj = xlsx.parse(fs.readFileSync(file.path));
  fs2.unlinkSync(file);

  if(obj && obj.length) {
    console.log(obj[0].data);
    //Treat the obj variable as an array of rows
    res.send(obj[0].data);
  } else {
    res.send("Error!");
  }
});


//Uploading multiple files
app.post("/uploadmultiple", upload.array("multiple", 10), (req, res, next) => {
    const files = req.files;

    if (!files) {
      const error = new Error("Please choose maximum 10 files.");
      error.httpStatusCode = 400;
      return next(error);
    }

    console.log(files);
    res.send(files);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);


//Alternate multiupload:
app.post("/multipleupload", uploadController.multipleUpload, (req, res, next) => {
    console.log(req.files);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);


app.post("/avatarUpload", uploadAvatarController.avatarUpload, (req, res, next) => {
    console.log(req);    
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);


const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post("/purchase", (req, res, next) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  stripe.customers
    .create({
      email: req.body.emailAddress,
      //card: '4242424242424242'//
      source: req.body.stripeTokenId
    })
    .then(customer =>
      stripe.charges.create({
        amount: req.body.amount,
        receipt_email: req.body.emailAddress,
        description: req.body.description,
        customer: customer.id,
        //source: req.body.stripeTokenId,
        currency: req.body.currency.toLowerCase()
      })
    )
    .then(async charge => {
      console.log("Payment successful!\n" + charge);
      const response = {
        headers,
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully paid for your items!",
          charge: charge
        })
      };

      //Update the Balance:
      await MongoClient.connect(
        URI,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) {
            console.error(err.message);
            //flash('error', err.message);
            return res.status(500).send({ msg: err.message });
          }

          db = client.db(BASE); //Right connection!
          db.collection("buyers").updateOne(
            { _id: req.body.buyerId },
            { $set: { balance: req.body.newBalance } },
            function(err, obj) {
              if (err) {
                console.error(err.message);
                return res.status(500).send({ msg: err.message });
              }
            }
          );
        }
      );

      //Send an e-mail to user:
      var mailOptions = {
        from: "peter@uniteprocurement.com",
        to: req.body.emailAddress,
        subject: "Order Paid Successfully!",
        text:
          "Hello,\n\n" +
          "We inform you that your purchase in value of" +
          req.body.amount +
          " " +
          req.body.currency +
          " has been successfully completed. Please wait for your delivery to finish.\nCurrently it was just a test, nothing for real yet though :)." +
          "\n\nWith kind regards,\nThe UNITE Public procurement Platform Team"
      };

      sgMail.send(mailOptions, function(err, resp) {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        }
        console.log(
          "Message sent: " + resp ? resp.response : req.body.emailAddress
        );
        req.flash(
          "success",
          "A verification email has been sent to " + req.body.emailAddress,
          +"."
        );
        res.json(response);
      });
    })
    .catch((err) => {
      console.log("Payment failed! Please repeat the operation.\n" + err);
      /*const response = {
        headers,
        statusCode: 500,
        body: JSON.stringify({
          error: err.message
        })
      };*/

      //res.json(response);
      res.status(500).end();
    });
});

//Autocomplete fields:
const jsonp = require("jsonp");

app.post("/countryAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.body.term, "i");
  var countryFilter = Country.find({ name: regex }, { name: 1 })
    .sort({ name: 1 })
    .limit(15); //Positive sort is ascending.
  countryFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.name
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      //req.flash("error", err.message);
      console.error(err.message);
      throw err;
    }
  });
});

app.post("/industryAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");
  var industryFilter = Industry.find({ name: regex }, { name: 1 })
    .sort({ name: 1 })
    .limit(15); //Negative sort means descending.

  industryFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.name
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      //res.json(err);
      console.error(err.message);
      throw err;
      //req.flash("error", err.message);
      //res.redirect('back');
    }
  });
});

app.post("/deleteBid", function(req, res, next) {
  MongoClient.connect(URI, { useUnifiedTopology: true }, function(err, db) {
    if (err) {
      console.error(err.message);
      res.json(err);
      //res.redirect('back');
    }

    var dbo = db.db(BASE), myquery = { _id: req.body.bidId };

    dbo.collection("bidrequests").deleteOne(myquery, function(err, resp) {
      if (err) {
        console.error(err.message);
        db.close();
        res.json(err);
        //res.redirect('back');
      }

      db.close();
    });
  });
});

app.post("/deleteFile", function(req, res, next) {
  //fs2.unlinkSync(req.body.file);
  console.log(req.body.file);

  fs2.unlink(req.body.file, function(err) {
    if (err) {
      req.flash("error", err.message);
      res.json(err);
    }
    //if no error, file has been deleted successfully
    console.log("File deleted!");
    req.flash("success", "File deleted!");
    res.status(200).end();
  });
});

app.post("/exists", function(req, res) {
  const path = req.body.path;

  fs2.access(path, fs.F_OK, err => {
    if (err) {
      console.error(err);
      res.json(err);
      //throw err;
    }

    return res.json({ exists: true });
  });
});

app.get("/industryGetAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");
  var industryFilter = Industry.find({ name: regex }, { name: 1 })
    .sort({ name: 1 })
    .limit(15); //Negative sort means descending.

  industryFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.name
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
      //res.json(err);
    }
  });
});

app.get("/bidStatuses", function(req, res, next) {
  var statusFilter = BidStatus.find({});

  statusFilter.exec(function(err, data) {
    var result = [];

    if(!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            value: item.value,
            name: item.value + " - " + item.name
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      res.json(err);
    }
  });
});

app.get("/bidCancelReasonTitles", async function(req, res, next) {
  BidCancelReasonTitle.find({})
    .exec()
    .then((titles) => {
      titles.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

      res.send(
        titles,
        {
          "Content-Type": "application/json"
        },
        200
      );
    });
});

app.get("/userCancelReasonTitles", async function(req, res, next) {
  UserCancelReasonTitle.find({})
    .exec()
    .then((titles) => {
      titles.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

      res.send(
        titles,
        {
          "Content-Type": "application/json"
        },
        200
      );
    });
});


app.get("/adminCancelReasonTitles", async function(req, res, next) {
  AdminCancelReasonTitle.find({})
    .exec()
    .then((titles) => {
      titles.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

      res.send(
        titles,
        {
          "Content-Type": "application/json"
        },
        200
      );
    });
});


app.post('/getFiles', function(req, res) {  
  fs2.readdir(req.body.folder, (err, files) => {  
    files.forEach((file) => {
      console.log(file);
    });
    res.json(files);
  });
});


app.get("/feedbackSubjects", async function(req, res, next) {
  FeedbackSubject.find({})
    .exec()
    .then((subjects) => {
      subjects.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

      res.send(
        subjects,
        {
          "Content-Type": "application/json"
        },
        200
      );
    });
});

app.get("/feedbacks", async function(req, res, next) {
  Feedback.find({})
    .exec()
    .then(feedbacks => {
      feedbacks.sort((a, b) =>
        a.createdAt > b.createdAt ? 1 : b.createdAt > a.createdAt ? -1 : 0
      );

      res.send(
        feedbacks,
        {
          "Content-Type": "application/json"
        },
        200
      );
    });
});

app.get("/uniteIDAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");
  var uniteIDFilter = Supervisor.find(
    { organizationUniteID: regex },
    { organizationUniteID: 1 }
  )
    .sort({ organizationUniteID: 1 })
    .limit(15); //Negative sort means descending.

  uniteIDFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.organizationUniteID
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
    }
  });
});

app.post("/uniteIDAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");
  var uniteIDFilter = Supervisor.find(
    { organizationUniteID: regex },
    { organizationUniteID: 1 }
  )
    .sort({ organizationUniteID: 1 })
    .limit(15); //Negative sort means descending.

  uniteIDFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.organizationUniteID
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
    }
  });
});

app.post("/currencyAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");

  var currencyFilter = Currency.find({ value: regex }, { value: 1, name: 1 })
    .sort({ value: 1 })
    .limit(10); //Negative sort means descending.

  currencyFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.value + "-" + item.name,
            value: item.name
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
    }
  });
});

app.get("/currencyGetAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");
  var val = regex? { value: regex } : {};
  var currencyFilter = Currency.find(val, { value: 1, name: 1 })
    .sort({ value: 1 })
    .limit(regex? 10 : 30); //Negative sort means descending.

  currencyFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.value,
            value: item.name
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
    }
  });
});

app.post("/prodServiceAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");
  var id = req.body["supplierId"];
  console.log(id);
  var values = regex && id? { productName: regex, supplier: new ObjectId(id) } : { supplier: (id) };

  var prodServiceFilter = ProductService.find(
    values,
    { productName: 1, price: 1, currency: 1 }
  )
    .sort({ productName: 1 })
    .limit(regex && id? parseInt(MAX_PROD) : 100); //Negative sort means descending.

  prodServiceFilter.exec(function(err, data) {
    var result = [];
    console.log(data.length);
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.productName,
            price: item.price,
            amount: item.amount,
            totalPrice: item.totalPrice,
            productImage: item.productImage,
            currency: item.currency
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
    }
  });
});

app.get("/capabilityInputAutocomplete", function(req, res, next) {
  var regex = new RegExp(req.query["term"], "i");

  var capDescriptionFilter = Supplier.find(
    { capabilityDescription: regex },
    { capabilityDescription: 1 }
  )
    .sort({ capabilityDescription: 1 })
    .limit(15);
  capDescriptionFilter.exec(function(err, data) {
    var result = [];

    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.capabilityDescription
          };

          result.push(obj);
        });
      }

      res.jsonp(result);
    } else {
      req.flash("error", err.message);
      throw err;
    }
  });
});


var db;
if (1 == 2)
  MongoClient.connect(URI, { useUnifiedTopology: true }, (err, client) => {
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
  .then(result => {
    return null;
  })
  .then(() => {
    //app.listen(5000);
  })
  .catch(console.error);