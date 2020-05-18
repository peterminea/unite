//Basic declarations:
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const dateTime = require("date-format-simple");
const multer = require("multer");
const fs = require("fs-extra");
const sortJson = require("sort-json");
const cookieParser = require('cookie-parser');

//Classes:
const BidRequest = require("./models/bidRequest");
const Buyer = require("./models/buyer");
const Supplier = require("./models/supplier");
const Supervisor = require("./models/supervisor");
const Message = require("./models/message");
const Country = require("./models/country");
const Industry = require("./models/industry");

const MONGODB_URI =
  "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";
const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
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
    cookie: { 
      secure: true
      //, maxAge: 7200000//2 hours in milliseconds
    },
    store: store
  })
);
//app.use(csrf({ cookie: true }));
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
const countryRoutes = require("./routes/countryAutocomplete");
const industryRoutes = require("./routes/industryAutocomplete");

//For chatting:
const connect = require("./dbconnect");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var url = require("url");

app.use("/", homeRoutes);
app.use("/bidRequest", bidRequestRoutes);
app.use("/supplier", supplierRoutes);
app.use("/buyer", buyerRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/chat", messageRoutes);
app.use("/countryAutocomplete", countryRoutes);
app.use("/industryAutocomplete", industryRoutes);

const port = 5000;
var server = app.listen(4000, () => {
  //console.log("server is running on port", server.address().port);
});

//Or this:
http.listen(port, () => {
  //console.log("Running on Port: " + port);
});

io.on("connection", socket => {
  console.log("user connected");
  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
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
    let chatMessage = new Message({ 
      message: msg, 
      sender: "Anonymous" });
    chatMessage.save();
  });
});

//Upload files to DB:
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  }
});

var upload = multer({ storage: storage });
var db;

MongoClient.connect(MONGODB_URI, (err, client) => {
  if (err) return console.log(err);

  db = client.db("test");
  app.listen(6000, () => {
    //console.log("listening on 6000");
  });
});
/*
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.ejs');
});*/

app.get('/countryAutocompleted', function(req, res) {
   alert('ARBENTO');
   var regex = new RegExp(req.query["term"], 'i');
   var query = Country.find({name: regex}, { 'name': 1 })/*.sort({"updated_at":-1}).sort({"created_at":-1})*/.limit(20);
       
    // Execute query in a callback and return users list
    query.exec(function(err, items) {
      if (!err) {
         // Method to construct the json result set
         var result = buildResultSet(items);
         res.send(result, {
            'Content-Type': 'application/json'
         }, 200);
      } else {
         res.send(JSON.stringify(err), {
            'Content-Type': 'application/json'
         }, 404);
      }
   });
});

app.post("/uploadfile", upload.single("singleFile"), (req, res, next) => {alert(1993);
  const file = req.file;

  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
});

//Uploading multiple files
app.post("/uploadmultiple",  upload.array("multipleFiles", 15),   (req, res, next) => {alert(1994);
    const files = req.files;

    if (!files) {
      const error = new Error("Please choose files");
      error.httpStatusCode = 400;
      return next(error);
    }

    res.send(files);
  }
);

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

    //const options = { ignoreCase: true, reverse: true, depth: 1};
    
  //let rawdata = fs.readFileSync('countries.json');  
 // let countries = JSON.parse(rawdata);
  
 // rawdata = fs.readFileSync('industries.json');
 // let industries = JSON.parse(rawdata);
  /*
  let rawdata = fs.readFileSync('industries_long.json');
  let industriesLong = JSON.parse(rawdata);  
  
  for(var i = 0; i < countries.length; i++) {
    const demoCountry = new Country({
    name : countries[i]
    });
    //console.log(countries[i]);
    //demoCountry.save();
  }
  
  industries.sort();
  //sortJson.overwrite('industries.json');
  fs.writeFileSync('industries.json', JSON.stringify(industries));
  
  for(var i = 0; i < industries.length; i++) {
    const demoIndustry = new Industry({
    name : industries[i]
    });
    //console.log(industries[i]);
    //demoIndustry.save();
  }  
  
    for(var i = 0; i < industriesLong.length; i++) {
    const demoIndustry = new Industry({
    name : industriesLong[i]
    });
    //console.log(industriesLong[i]);
    //demoIndustry.save();
  }
  
  */
    return null;
  })
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch(console.error);