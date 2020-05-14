//Basic declarations:
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const dateTime = require("date-format-simple");
const multer = require('multer');
const fs = require('fs-extra');

//Classes:
const BidRequest = require("./models/bidRequest");
const Buyer = require("./models/buyer");
const Supplier = require("./models/supplier");
const Supervisor = require("./models/supervisor");
const Message = require("./models/message");

const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";
const app = express();
/*
//For connecting the app to a subdomain:

function checkHttps(req, res, next){
  // protocol check, if http, redirect to https
  
  if(req.get('X-Forwarded-Proto').indexOf("https")!=-1){
    return next()
  } else {
    res.redirect('https://' + req.hostname + req.url);
  }
}

app.all('*', checkHttps);
*/


const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.use(express.static("public"));
app.set("view engine", "ejs");

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: "26UNWwbu26FvXZTJQBkf45dLSV7gG9bx",
    resave: false,
    saveUninitialized: true,
    store: store
  })
);

// Password Checking & Protecting
const csrfProtection = csrf();

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routes
const homeRoutes = require("./routes/home");
const bidRequestRoutes = require("./routes/bidRequest");
const supplierRoutes = require("./routes/supplier");
const buyerRoutes = require("./routes/buyer");
const supervisorRoutes = require("./routes/supervisor");
const messageRoutes = require("./routes/chat");

app.use("/", homeRoutes);
app.use("/bidRequest", bidRequestRoutes);
app.use("/supplier", supplierRoutes);
app.use("/buyer", buyerRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/chat", messageRoutes);


//For chatting:
const connect = require("./dbconnect");
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 5000;

var server = app.listen(4000, () => {
 console.log('server is running on port', server.address().port);
});

//Or this:
http.listen(port, () => {
  console.log("Running on Port: " + port);
});

io.on("connection", (socket)=>{
    console.log("user connected");
    socket.on("disconnect", ()=>{
    console.log("Disconnected")
})
});

  //Someone is typing:
  io.on("typing", data => {
    io.broadcast.emit("notifyTyping", {
      user: data.user,
      message: data.message
    });
  });

  //When someone stops typing:
  io.on("stopTyping", () => {
    io.broadcast.emit("notifyStopTyping");
  });

  io.on("chat message", function(msg) {
    console.log("message: " + msg);

    //broadcast message to everyone in port:5000 except yourself.
    io.broadcast.emit("received", { message: msg });

    //save chat to the database
    connect.then(db => {
      console.log("connected correctly to the server");
      let chatMessage = new Message({ message: msg, sender: "Anonymous" });
      chatMessage.save();
    });
  });


//Upload files to DB:
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage });
var db;

MongoClient.connect(MONGODB_URI, (err, client) => {
  if (err)
    return console.log(err);
  
  db = client.db('test');
  app.listen(6000, () => {
    console.log('listening on 6000');
  });
});
/*
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.ejs');
});*/

// upload single file

app.post('/uploadfile', upload.single('singleFile'), (req, res, next) => {
  const file = req.file;
  
  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
 
   res.send(file);
});

//Uploading multiple files
app.post('/uploadmultiple', upload.array('multipleFiles', 15), (req, res, next) => {
  const files = req.files;
  
  if (!files) {
    const error = new Error('Please choose files');
    error.httpStatusCode = 400;
    return next(error);
  }

    res.send(files);
});

/*
app.post('/uploadphoto', upload.single('picture'), (req, res) => {
  var img = fs.readFileSync(req.file.path);
  var encode_image = img.toString('base64');
 // Define a JSONobject for the image attributes for saving to database
 
  var finalImg = {
      contentType: req.file.mimetype,
      image:  new Buffer(encode_image, 'base64')
   };
  
  db.collection('mycollection').insertOne(finalImg, (err, result) => {
  	console.log(result);
    if (err) 
      return console.log(err);

    console.log('saved to database');
    res.redirect('/');
  });
});


  app.get('/photos', (req, res) => {
  db.collection('mycollection').find().toArray((err, result) => {

  const imgArray= result.map(element => element._id);
	console.log(imgArray);

   if (err) 
     return console.log(err);
   res.send(imgArray);  
   
  });
});

app.get('/photo/:id', (req, res) => {
var filename = req.params.id;

db.collection('mycollection').findOne({'_id': ObjectId(filename) }, (err, result) => {
    if (err) 
      return console.log(err);

   res.contentType('image/jpeg');
   res.send(result.image.buffer);   
  });
});*/

// Database configuration
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(result => {
    
    //Here comes some mockup data for our model entities:
   /*
      const demoSupplier = new Supplier({
        companyName: "Paulaner Brauerei Wien",
        directorsName: "Herr Direktor",
        contactName: "Demo Contact Name",
        title: "Demo Title",
        emailAddress: "demo@email.com",
        password: "demopass",
        companyRegistrationNo: "0",
        registrationCompany: "Demo Company",
        companyAddress: "Demo Address",
        storageLocation: "Demo Location",
        contactMobileNumber: "+000000000000",
        country: "Austria",
        industry: "Demo Industry",
        employeeNumbers: 5,
        lastYearTurnover: "5",
        website: "www.demo.dem",
        facebookURL: "https://www.facebook.com/demoName",
        instagramURL: "https://www.instagram.com/demoName",
        twitterURL: "https://www.twitter.com/demoName",
        linkedinURL: "https://www.linkedin.com/demoName",
        otherSocialMediaURL: "https://www.tumblr.com/thumbtombraider",
        commodities: "Isopropylic Alcohol, Silica Gel",
        capabilityDescription: "Demo Description",
        relevantExperience: "Demo Experience",
        supportingInformation: "Default info in our documents",
        UNITETermsAndConditions: true,
        antibriberyAgreement: true
      });
  
    const demoBuyer = new Buyer({
      organizationName: "AKH Krankenhaus Wien",
      organizationUniteID: "1",
      contactName: "Demo Contact Name",
      emailAddress: "demo@email.com",
      password: "Sha9*gil^4Gh",
      deptAgencyGroup: "Abdulsalam Mustapha Al-Shawaf, Nablus, Irak",
      qualification: "Basic qualification",
      address: "Casino Boulevard, Amsterdam",
      country: "Netherlands"
    });
    
      //demoSupplier.save(); demoBuyer.save();
  
      const demoGovernmentSupervisor = new Supervisor({
      organisationName: "European Parliament",
      contactName: "Van der Sagner, Galesio",
      emailAddress: "galesio.vandersagner@parliament.eu",
      password: "S&ki0_9mil^j*8Ab%O",
      address: "Viale Maciste 113, Caposele, Avellino, IT",
      country: "Italy",
      UNITETermsAndConditions: true,
      antibriberyAgreement: true
    });
    
    demoGovernmentSupervisor.save();   

   const {ObjectId} = require('mongodb');
   
   const demoBidRequest = new BidRequest({
      itemDescription: "Refrigerators",
      commodityList: "Zanussi, Bosch, Whirlpool",      
      itemDescriptionLong: "Medium-size refrigerators",
      itemDescriptionUrl: "https://www.demos.org",
      amount: 10,
      deliveryLocation: "Mariahilfestrasse 30, Vienna, Austria",
      deliveryRequirements: "Original papers",
      complianceRequirements: "Certificate of authenticity",      
      complianceRequirementsUrl: "https://www.iso9001.net",
      otherRequirements: "Fast delivery",
      status: 1,
      price: 5,
      buyer: ObjectId("507f191e810c18729de860ea"),
      supplier: ObjectId("507f191e810c17729de860ea")
    });
    
    demoBidRequest.save().then(result => {
      console.log('Bid requested successfully!');      
    }).catch(console.error);*/
  
    return null;
  })
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch(console.error);