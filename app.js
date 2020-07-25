'use strict';

//Classes:
const BidRequest = require("./models/bidRequest");
const BidStatus = require("./models/bidStatus");
const CancelReasonTitle = require("./models/cancelReasonTitle");
const Feedback = require("./models/feedback");
const FeedbackSubject = require("./models/feedbackSubject");
const Buyer = require("./models/buyer");
const Supplier = require("./models/supplier");
const Supervisor = require("./models/supervisor");
const Currency = require("./models/currency");
const Message = require("./models/message");
const Country = require("./models/country");
const Industry = require("./models/industry");
const Capability = require("./models/capability");
const ProductService = require("./models/productService");
const BannedUser = require('./models/bannedUser');

//Basic declarations:
const os = require('os');
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf");
const multer = require("multer");
const fs = require("fs-extra");
const fs2 = require("fs");
const dateformat = require("dateformat");
const { basicFormat, customFormat, normalFormat } = require('./middleware/dateConversions');
const process = require("process");
const BadWords = require("bad-words");
const crypto = require("crypto");
const moment = require("moment");
const http2 = require("http2");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const MongoClient = require("mongodb").MongoClient;
const BASE = process.env.BASE;
const URI = process.env.MONGODB_URI;
const MAX_PROD = process.env.SUP_MAX_PROD;
const stripeSecretKey = process.env.STRIPE_KEY_SECRET;
const stripePublicKey = process.env.STRIPE_KEY_PUBLIC;
const stripe = require("stripe")(stripeSecretKey);
const cookieParser = require("cookie-parser");
//require('dotenv').config();

//const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";//The DB url is actually saved as an Environment letiable, it will be easier to use anywhere in the application that way.
//Syntax: process.env.MONGODB_URI

const app = express();
const server = http.createServer(app);
const socket = socketio(server);
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

app.use('/public', (req, res, next) => {
  console.log(req);
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
// Password Checking & Protecting
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


app.get('/loadBannedUsers', (req, res) => {//Banned user table.  
  BannedUser.find({}, (err, users) => {
     if (err) {
        return console.error(err.message);
      }
    
    users.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
    res.send(users);
  });  
});


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
//Lambda letiant: messages.sort((a,b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
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
  let message = new Message(req.body);

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

    let { error, user } = addUser({
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
    let msg = generateSimpleMessage("Admin", "Welcome to the UNITE chat!");
    sock.emit("message", msg);
    let users = getUsersInRoom(user.room);
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
    let user = removeUser(sock.id);
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
    let user = getUser(sock.id);

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

    let mesg = new Message(msgData);

    mesg.save(err => {
      if (err) {
        console.error(err.message);
        //flash('error', err.message);
        throw err;
      }
    });
    
    console.log(callback);
    socket
      .to(user.room)
      .emit("message", generateMessage(user.username, msgData));
    if (typeof callback !== "undefined") callback();
  });

  sock.on("sendLocation", (coords, callback) => {
    console.log(coords);
    let user = getUser(sock.id);
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
    let user = getUser(sock.id);
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

const { fileExists } = require('./middleware/templates');

//Buyers should load a Catalog of Products by clicking on a button in their Index page:
app.get("/loadProductsCatalog", (req, res) => {
  ProductService.find({}, async (err, products) => {
    if (!products || !products.length) {
      return false;
    }

    let catalogItems = [];

    for (let i in products) {
      let supId = products[i].supplier;

      await Supplier.findOne({ _id: supId }, function(err, obj) {
        if (err) {
          console.log(err.message);
          throw err;
        }

        if (obj)
          catalogItems.push({
            productId: products[i]._id,
            supplierId: obj._id,
            productName: products[i].productName,
            price: products[i].price,
            amount: products[i].amount,
            totalPrice: products[i].totalPrice,
            productImage: fileExists(products[i].productImage)? products[i].productImage : '',
            buyerCurrency: products[i].currency,
            supplierCurrency: obj.currency,
            supplierName: obj.companyName
          });
      });
    }

    catalogItems.sort(function(a, b) {
      return a.productName.localeCompare(b.productName);
    });

    console.log((catalogItems[0].productImage));
    res.json(catalogItems);
  });
});

//Upload files to DB & to Glitch:
const ObjectId = require("mongodb").ObjectId;
const uploadController = require("./controllers/upload");
const uploadAvatarController = require("./controllers/uploadAvatar");

let methodOverride = require("method-override");
app.use(methodOverride("_method"));

let extArray = [".png", ".jpg", ".jpeg", ".gif", ".bmp", '.csv', ".pdf", ".txt", ".doc", ".docx", ".rtf", '.xls', '.xlsx', '.ppt', '.pptx'],
  prodImageArray = ['.png', '.jpg', '.jpeg', '.bmp', '.csv', '.gif'],
  excelArray = [".xls", ".xlsx"];

//Upload files to Glitch:
let storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("${__dirname}/../public/uploads"));
  },
  filename: function(req, file, callback) {
    // + path.extname(file.originalname)
    let date = dateformat(new Date(), "dddd_mmmm_dS_yyyy_h.MM.ss_TT"); //Date.now()
    let date2 = moment(new Date().getTime()).format("HH.mm.ss.a");
    callback(null, file.fieldname + "_" + date2 + "_" + file.originalname); //The name itself.
  }
});


let upload = multer({
  storage: storage,
  fileFilter: function(req, file, callback) {
    let ext = path.extname(file.originalname);
    let isItIn = false;

    for (let i in extArray)
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
    fileSize: process.env.FILE_UPLOAD_MAX_SIZE
  }
});


let uploadExcel = multer({
  storage: storage,
  fileFilter: function(req, file, callback) {
    let ext = path.extname(file.originalname);
    let isItIn = false;

    for (let i in excelArray)
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
    fileSize: process.env.FILE_UPLOAD_MAX_SIZE
  }
});


let prodImageStorage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("${__dirname}/../public/productImages"));    
  },
  filename: function(req, file, callback) {
    // + path.extname(file.originalname)
    let date = dateformat(new Date(), "dddd_mmmm_dS_yyyy_h.MM.ss_TT"); //Date.now()
    let date2 = moment(new Date().getTime()).format("HH.mm.ss.a");
    callback(null, file.originalname.substring(file.originalname.lastIndexOf('.')+1) + "_" + date + "_" + file.originalname); //The name itself.
  }
});


let uploadProdImage = multer({
  storage: prodImageStorage,
  fileFilter: function(req, file, callback) {
    let ext = path.extname(file.originalname);
    let isItIn = false;

    for (let i in prodImageArray)
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
    fileSize: process.env.FILE_UPLOAD_MAX_SIZE
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
  
  let tmp_path = req.file.path;
  let target_path = "custom/uploads/" + req.file.originalname;
  let src = fs.createReadStream(tmp_path);
  let dest = fs.createWriteStream(target_path);
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


let xlsx = require("node-xlsx");
app.post("/uploadExcel", uploadExcel.single("single"), (req, res, next) => {
  const file = req.file;

  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  let obj = xlsx.parse(fs.readFileSync(file.path));
  fs2.unlinkSync(file);

  if(obj && obj.length) {
    console.log(obj[0].data);
    //Treat the obj letiable as an array of rows
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
    console.log(req.files);
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
      let mailOptions = {
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

const jsonp = require("jsonp");

app.post("/deleteBid", function(req, res, next) {
  MongoClient.connect(URI, { useUnifiedTopology: true }, function(err, db) {
    if (err) {
      console.error(err.message);
      res.json(err);
      //res.redirect('back');
    }

    let dbo = db.db(BASE), myquery = { _id: req.body.bidId };

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
  
  if (fs2.existsSync(path)) {
    return res.json({ exists: fs2.existsSync(path)? true : false });
  }
});


app.get("/bidStatuses", function(req, res, next) {
  let statusFilter = BidStatus.find({});

  statusFilter.exec(function(err, data) {
    let result = [];

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


app.post("/cancelReasonTitles", async function(req, res, next) {
  let objectType = req.body.objectType;
  const isAdmin = req.body.isAdmin;
  const isSupervisor = req.body.isSupervisor;
  
  let val = objectType && isAdmin? { type: objectType , isAdmin: true } 
  : objectType && isSupervisor? { type: objectType, isSupervisor: isSupervisor } 
  : objectType? { type: objectType } : {};
  
  CancelReasonTitle.find({})
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


//Autocomplete fields:
app.post("/uniteIDAutocomplete", function(req, res, next) {
  let regex = new RegExp(req.query["term"], "i");
  let val = regex? { organizationUniteID: regex } : {};
  
  let uniteIDFilter = Supervisor.find(
    val,
    { organizationUniteID: 1 }
  )
    .sort({ organizationUniteID: 1 })
    .limit(regex? 15 : 100); //Negative sort means descending.

  uniteIDFilter.exec(function(err, data) {
    let result = [];

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
  let regex = new RegExp(req.query["term"], "i");
  let val = regex? { value: regex } : {};
  let currencyFilter = Currency.find(val, { value: 1, name: 1 })
    .sort({ value: 1 })
    .limit(regex? 150 : 200); //Negative sort means descending.

  currencyFilter.exec(function(err, data) {
    let result = [];

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
  let regex = new RegExp(req.query["term"], "i");
  let id = req.body["supplierId"];
  console.log(id);
  let values = regex && id? { productName: regex, supplier: new ObjectId(id) } : { supplier: (id) };

  let prodServiceFilter = ProductService.find(
    values,
    { productName: 1, price: 1, currency: 1 }
  )
    .sort({ productName: 1 })
    .limit(regex && id? parseInt(MAX_PROD) : 100); //Negative sort means descending.

  prodServiceFilter.exec(function(err, data) {
    let result = [];
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


app.post("/capabilityInputAutocomplete", function(req, res, next) {  
  let regex = new RegExp(req.query["term"], "i");
  let val = regex? { capabilityDescription: regex } : {};

  let capDescriptionFilter = Supplier.find(
    val,
    { capabilityDescription: 1 }
  )
    .sort({ capabilityDescription: 1 })
    .limit(15);
  capDescriptionFilter.exec(function(err, data) {
    let result = [];

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


const fetch = require('node-fetch');
let url = "https://www.floatrates.com/daily/eur.json";
let settings = { method: "Get" };

fetch(url, settings)
    .then(res => res.json())
    .then((json) => {
      //console.log(JSON.stringify(json));
  let currency = JSON.stringify(json);
  currency = '[' + (currency).split('},').join('}},{') + ']';
  currency = JSON.parse(currency);
 
  for(let i of currency) {
    let t = JSON.stringify(i);
    let obj = JSON.parse(t.substring(7, t.length-1));
    //console.log(obj);
  }
  
  let fx = {
    base: process.env.APP_DEFAULT_CURR,
  }, t, obj = [], str = 'fx.rates = {\n';
  
  for(let i in currency) {
    t = JSON.stringify(currency[i]);
    obj.push(JSON.parse(t.substring(7, t.length-1)));
  }
  
  obj.sort(function(a, b) {
      return a.code.localeCompare(b.code);
    });
  
  for(let i in obj) {
    str += obj[i].code + ': ' + obj[i].rate + (i == obj.length-1? '' : ',\n');
  } 

  str += '\n}';
  
  eval(str);
  //console.log(fx);  
  });

let networkInterfaces = os.networkInterfaces();

let nonLocalInterfaces = {};
for (let inet in networkInterfaces) {
  let addresses = networkInterfaces[inet];
  for (let i=0; i<addresses.length; i++) {
    let address = addresses[i];
    if (!address.internal) {
      if (!nonLocalInterfaces[inet]) {
        nonLocalInterfaces[inet] = [];
      }
      nonLocalInterfaces[inet].push(address);
    }
  }
}


async function getUsers(db, table, obj) {
    let newObj = obj && obj instanceof Object? obj : {};
  
    let myPromise = () => {
       return new Promise((resolve, reject) => {
          db
          .collection(table)
          .find(newObj)
          //.limit(1)
          .toArray(function(err, data) {
             err 
                ? reject(err) 
                : resolve(data);
           });
       });
    };
   
    let result = await myPromise();    
    return result;
}


const bcrypt = require('bcryptjs');
let db;

async function getUsers2(db, table) {
  const promise =  await db.collection(''+table+'').find({});
 
  return promise;
}


if (1 == 2)
  MongoClient.connect(URI, { useUnifiedTopology: true }, async (err, client) => {
    if (err) {
      console.error(err.message);
      throw err;
    }

    db = client.db(BASE); //Right connection!
    let sup = await getUsers(db, 'suppliers');    
    
    for(let i of sup) {
      let currency = i.currency;//i.currenciesList && i.currenciesList.length? i.currenciesList[0] : i.currency;
      //if(currency.length > 3) currency = currency.substring(0, 3);
      //if(currency.length < 3 && currency.charAt(0) == 'E') currency = 'EUR';
      db.collection('productservices').updateMany({supplier: i._id}, { $set: { currency: i.currency } }, function(err, obj) {});
     // let currenciesList = [];
     // for(let j = 0; j < i.currenciesList.length; j++)
     //   currenciesList.push(currency);
      
      //db.collection('suppliers').updateOne({ _id: i._id}, { $set: { currenciesList: currenciesList } }, function(err, obj) {});
      console.log(currency);
    }
    
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