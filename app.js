//Basic declarations:
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const dateTime = require("date-format-simple");
//const dateTime = require("simple-datetime-formater");
const multer = require("multer");
//const uploads = multer({ dest: 'upload/'});
const fs = require("fs-extra");
const sortJson = require("sort-json");
const cookieParser = require('cookie-parser');
const path = require('path');
const process = require('process');
const BASE = process.env.BASE;
const URI = process.env.MONGODB_URI;
const MAX_PROD = process.env.SUP_MAX_PROD;

//Classes:
const BidRequest = require("./models/bidRequest");
const BidStatus = require("./models/bidStatus");
const Buyer = require("./models/buyer");
const Supplier = require("./models/supplier");
const Supervisor = require("./models/supervisor");
const Currency = require("./models/currency");
const Message = require("./models/message");
const Country = require("./models/country");
const Industry = require("./models/industry");
const Capability = require('./models/capability');
const ProductService = require("./models/productService");

//const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";//The DB url is actually saved as an Environment variable, it will be easier to use anywhere in the application that way.
//Syntax: process.env.MONGODB_URI

const app = express();
mongoose.Promise = global.Promise;

const store = new MongoDBStore({
  uri: URI,
  collection: "sessions"
});

//app.use(express.static(path.join(__dirname, '..', "public")));
app.use(express.static('public'));
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
app.use(flash());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

//Routes and their usage:
const homeRoutes = require("./routes/home");
const supplierRoutes = require("./routes/supplier");
const buyerRoutes = require("./routes/buyer");
const supervisorRoutes = require("./routes/supervisor");
//const messageRoutes = require("./routes/chat");
//const imageRoutes = require('./routes/image');

app.use("/", homeRoutes);
app.use("/supplier", supplierRoutes);
app.use("/buyer", buyerRoutes);
app.use("/supervisor", supervisorRoutes);
//app.use("/chat", messageRoutes);

//For chatting:
const connect = require("./dbconnect");
const http = require("http").Server(app);
const socket = require("socket.io")(http);
const port = 5000;
var url = require("url");
const MongoClient = require("mongodb").MongoClient;
var db;
//var ProductService = require('./models/productService');

MongoClient.connect(URI, (err, client) => {
  if (err)
    return console.error(err.message);

  db = client.db(BASE);//Right connection!
  
  process.on('uncaughtException', function (err) {
    console.log(err);
  }); 
  
  /*    
  const currency = new Currency({
    name: 'Norwegian Krona',
    value: 'NOK'
  });
  
  //currency.save();
    
  const bidStatus = new BidStatus({
    value: 6,
    name: 'Buyer cancelled the request.'
  });
  
  //bidStatus.save();
  */
  //Cleanup script:
  /*
  var capability =  Capability.find({});
  var prodService =  ProductService.find({});  
  var invalidCapProd = [];
  
  function getCaps() {
   var promise = capability.exec();
   return promise;
  }
  
  function getProds() {
   var promise = prodService.exec();
   return promise;
  }
  
  function getSups(id) {
    var promise = Supplier.find({_id: id}).exec();
    return promise;
  }

  var promise1 = getCaps(), promise2 = getProds();  

  promise1.then(function(caps) {
     caps.forEach(function(cap) {          
        var promise = getSups(cap.supplier);
        promise.then(function(sups) {
          if(sups.length == 0) 
            invalidCapProd.push(cap.supplier);
        });
     });
  });

  promise2.then(function(prods) {
     prods.forEach(function(prod) {          
        var promise = getSups(prod.supplier);
        promise.then(function(sups) {
          if(sups.length == 0) 
            invalidCapProd.push(prod.supplier);
        });
     });
  });

  setTimeout(function() {
    console.log(invalidCapProd.length + ' DROSU DOSUL');
    for(var i in invalidCapProd) {
      var myquery = { supplier: (invalidCapProd[i]) };
      db.collection("productservices").deleteOne(myquery, function(err, obj) {
      });
      db.collection("capabilities").deleteOne(myquery, function(err, obj) {
      });
    }
  }, 5000);
  
  if(1==2)
  capability.exec(async function(err, data) {
    if(data && data.length) {      
      for(var i in data) {
      var supp = (data[i].supplier);
      
      var sup = Supplier.find({_id: (supp)});
        sup.exec(async function(err, data) {          
          if(!data || data.length == 0) {
            var myquery = { supplier: (supp) };          
            db.collection("productservices").deleteOne(myquery, function(err, obj) {
            });
            db.collection("capabilities").deleteOne(myquery, function(err, obj) {
            });
            }
        });
      }
    }
  });
  
  Industry.find({}).exec().then((inds) => {//Ascending sorting of table contents by name, then resetting its contents based on this new sorting.
    console.log(inds.length + ' ZABAL');
    inds.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    
    for(var i in inds) {
      //console.log(inds[i].name);
      var myQuery = {name: inds[i].name};      
      
      const ind = new Industry({
      //_id: inds[i]._id,
      name: inds[i].name
      //, __v: inds[i].__v? inds[i].__v : 0
      });
      
      //db.collection('industries').deleteOne(myQuery, function(err, obj) {});
      //ind.save();      
    }
  });
  
  ProductService.find({}).exec().then((prods) => {//Products refactored.
    for(var i in prods) {
      var myQuery = {_id: prods[i]._id};
      var setVal = !prods[i].price && !prods[i].productPrice? {price: 5}
      : (prods[i].productPrice && prods[i].productPrice == 1)? {productPrice: 5} 
      : (prods[i].price && prods[i].price == 1)? {price: 2}
      : prods[i].productPrice? {productPrice: prods[i].productPrice}  : {price: prods[i].price};
      
      const prod = new ProductService({
        productName: prods[i].productName,
        supplier: prods[i].supplier,
        price: prods[i].price? prods[i].price : prods[i].productPrice? prods[i].productPrice : 5,
        currency: prods[i].currency? prods[i].currency : 'EUR',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      console.log(prod);     
     // db.collection('productservices').deleteOne(myQuery, function(err, obj) {});
      //prod.save();
    }
  });  
  */
  
  //db.collection("suppliers").ensureIndex( { "companyName": 1, "emailAddress": 1 }, { unique: true } );
  
  //Refactor the orders table:
  /*
  function prom(bids, i, len) {   
    if(bids[i].buyer && bids[i].supplier) {
      var promise1 = Buyer.findOne({_id: bids[i].buyer}).exec();
      
      promise1.then((buys) => {
        if(buys) {
          var query = {_id: bids[i]._id}, newvalues = { $set: {buyerName: buys.organizationName} };
          db.collection("bidrequests").updateOne(query, newvalues, function(err, obj) {});
        } else {
          db.collection("bidrequests").deleteOne({_id: bids[i]._id}, function(err, obj) {});
        }
      });
      
      var promise2 = Supplier.findOne({_id: bids[i].supplier}).exec();
        promise2.then((sups) => {
          if(sups) {
            var query = {_id: bids[i]._id}, newvalues = { $set: {supplierName: sups.companyName} };
            db.collection("bidrequests").updateOne(query, newvalues, function(err, obj) {});
          } else {
            db.collection("bidrequests").deleteOne({_id: bids[i]._id}, function(err, obj) {});
          }
        });
    } else {
      db.collection("bidrequests").deleteOne({_id: bids[i]._id}, function(err, obj) {});
    }
    
    if(i < len) 
      setTimeout(prom(bids, i+1, len), 6000);
  }
  
  var promise = BidRequest.find({}).exec();
  promise.then( (bids) =>  {
    prom(bids, 0, bids.length);
  });
  
  var currenciesList = [];
  currenciesList.push('EUR');
  currenciesList.push('EUR');  
  currenciesList.push('EUR');  
  
  var productsList = [];  
  productsList.push('Mask');
  productsList.push('Ventilator');
  productsList.push('Disinfecting');
  
  var pricesList = [];
  pricesList.push(3);
  pricesList.push(2);
  pricesList.push(5);
  
  //console.log(currenciesList + ' ' + productsList + ' ' + pricesList);
  var myQuery = {};
  var newValues = { $set: {currenciesList: currenciesList, pricesList: pricesList, productsServicesOffered: productsList} };
  
  //db.collection("suppliers").updateMany(myQuery, newValues, function(err, obj) {});
  */

   // db.collection('suppliers').find({companyName: {$regex: "^(?!Demo$)"}})
  // db.collection('suppliers').find({companyName: {$regex: /^((?!Demo).)*$/}})
  // db.collection('suppliers').find({companyName: { $not: /^Demo.*/ }})
  // db.collection('suppliers').find({ companyName: $not:{$regex: /^Demo.*/ }}})
  /*
  var productsList = [];  
  productsList.push('Tempera');
  productsList.push('Paintbrushes');
  productsList.push('Frames');
  
  var amountList = [];
  amountList.push(2);
  amountList.push(5);
  amountList.push(3);
  
  var priceList = [];
  priceList.push(6);
  priceList.push(10);
  priceList.push(15);
  
  var productList = [];
  productList.push("Product name: 'Tempera', amount: 2, price: 6.");
  productList.push("Product name: 'Paintbrushes', amount: 5, price: 10.");
  productList.push("Product name: 'Frames', amount: 3, price: 15.");
  
  var myQuery = {}, newValues = { $set: {productsServicesOffered: productsList, amountList: amountList, priceList: priceList, products: productList} };
  db.collection("bidrequests").updateMany(myQuery, newValues, function(err, obj) {});
  
  
  //db.collection("bidrequests").updateMany({}, { $set: {itemDescriptionLong: "Pictures on walls in isolation chambers for COVID patients"} }, function(err, obj) {});  
  
  //db.collection("bidrequests").updateMany({}, { $set: {requestName: "Basic Tender Request - May 30th, 2020"} }, function(err, obj) {}); 
  */
});


app.post('/processBuyer', (req, res) => {
  connect.then(db => {
    db.collection("buyers").deleteOne({_id: req.query('id')}, function(err, obj) {
      });  
  }); 
});


function compareTimes(a, b) {
  if ( a.time < b.time ){
    return -1;
  }
  if ( a.time > b.time ){
    return 1;
  }
  return 0;
}

//Lambda variant: objs.sort((a,b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
app.get('/messages', (req, res) => {
  //console.log(req.query.from + ' LBOHALAM');
  Message.find({
      from: req.query.from, 
     to: req.query.to
    }, (err, messages) => {
      if(err) {
        console.error(err.message);
        return false;
      }
   
      Message.find({from: req.query.to, to: req.query.from}, (err, messages2) => {
        var allMessages = [];
        for(var msg of messages) {
          allMessages.push(msg);
        }
        for(var msg of messages2) {
          allMessages.push(msg);
        }
        
        allMessages.sort(compareTimes);
        res.send(allMessages);
      });
  });
});


app.post('/messages', (req, res) => {
  var message = new Message(req.body);
  
  message.save((err) => {
    if(err)
      return res.sendStatus(500);
    socket.emit('message', req.body);
    res.sendStatus(200);
  })
});


//setup event listener
socket.on("connection", socket => {
  console.log("user connected");

  socket.on("disconnect", function() {
    console.log("user disconnected");
  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("notifyTyping", {
      user: data.user,
      from: data.from,
      to: data.to,
      reqId: data.reqId,
      message: data.message
    });
  });

  //when someone stops typing
  socket.on("stopTyping", () => {
    socket.broadcast.emit("notifyStopTyping");
  });

  socket.on("chat message", function(msgData) {
   //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", {
      message: msgData.msg
    });

    //save chat to the database
    connect.then(db => {
      console.log("Connected directly to the server!");
      
      let chatMessage = new Message({ 
        message: msgData.msg,
        from: msgData.from,
        to: msgData.to,
        time: Date.now(),
        bidRequestId: msgData.reqId,
        sender: msgData.fromName,
        receiver: msgData.toName
      });

      chatMessage.save();
    });
  });
});

//wire up the server to listen to our port 5000
app.listen(port, () => {
  console.log("Connected to port: " + port)
});

//Upload files to DB:
const ObjectId = require("mongodb").ObjectId;
const uploadController = require("./controllers/upload");

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join('${__dirname}/../uploads'));
    //callback(null, 'uploads/');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname + '-' + file.fieldname + '-' + Date.now() + path.extname(file.originalname));//The name itself.
  }
});

var extArray = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.docx', '.rtf'];
 
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    var isItIn = false;
    
    for(var i in extArray) 
      if(ext.toLowerCase() == extArray[i].toLowerCase()) {
        isItIn = true;
      }
    if(!isItIn) {
      return callback(new Error('Extension forbidden!'));
    }
    
    callback(null, true);
  },
  limits: {
    fileSize: 1024 * 1024//1 MB
  }
});


app.post("/uploadfile", upload.single("single"), (req, res, next) => { 
  const file = req.file;
  
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
  return true;

     /** When using the "single"
      data come in "req.file" regardless of the attribute "name". **/
  var tmp_path = req.file.path;

  /** The original name of the uploaded file
      stored in the variable "originalname". **/
  var target_path = '/uploads/' + req.file.originalname;

  /** A better way to copy the uploaded file. **/
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function() {
    //res.render('complete'); 
  });
  src.on('error', function(err) {
    //res.render('error'); 
  });
});


//Uploading multiple files
app.post("/uploadmultiple",  upload.array("multiple", 12),   (req, res, next) => {
    const files = req.files;
    
    if (!files) {
      const error = new Error("Please choose files (maximum 12)");
      error.httpStatusCode = 400;
      return next(error);
    }
  
    console.log(files);
    res.send(files);
  }
);

//Alternate multiupload:
app.post("/multipleupload", uploadController.multipleUpload);

//Autocomplete fields:
//var country = Country.find({});
//var industry = Industry.find({});
const jsonp = require('jsonp');

app.post('/countryAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.body.term, 'i');  
  var countryFilter = Country.find({name: regex}, {"name": 1})
  .sort({"name" : 1})
  .limit(10);//Positive sort is ascending.  
  countryFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.name
          };
          
          result.push(obj);
        });
      }
      
      res.jsonp(result);
      
      if(1==2)res.send(result, {
            'Content-Type': 'application/json'
         }, 100);
    }
  });
});

app.post('/industryAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  var industryFilter = Industry.find({name: regex}, {"name": 1})
    .sort({"name" : 1})
    .limit(10);//Negative sort means descending.  

  industryFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item=>{
          let obj = {
            id: item._id,
            name: item.name
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);     
    }
  });
});


app.get('/industryGetAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  var industryFilter = Industry.find({name: regex}, {"name": 1})
    .sort({"name" : 1})
    .limit(10);//Negative sort means descending.  

  industryFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item=>{
          let obj = {
            id: item._id,
            name: item.name
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);     
    }
  });
});


app.get('/bidStatuses', function(req, res, next) {  
  var statusFilter = BidStatus.find({});
  
  statusFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item=>{
          let obj = {
            id: item._id,
            value: item.value,
            name: item.value + ' - ' + item.name
          };
          
          result.push(obj);
        });
      }
      
      res.jsonp(result);     
    }
  });
});


app.post('/uniteIDAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  var uniteIDFilter = Supervisor.find({organizationUniteID: regex}, {"organizationUniteID": 1})
    .sort({"organizationUniteID" : 1})
    .limit(10);//Negative sort means descending.  

  uniteIDFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach( (item) => {
          let obj = {
            id: item._id,
            name: item.organizationUniteID
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);     
    }
  });
});


app.post('/currencyAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  
  var currencyFilter = Currency.find({value: regex}, {"value": 1, "name": 1})
    .sort({"value" : 1})
    .limit(10);//Negative sort means descending.  

  currencyFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item=>{
          let obj = {
            id: item._id,
            name: item.value + '-' + item.name,
            value: item.name
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);     
    }
  });
});


app.get('/currencyGetAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  
  var currencyFilter = Currency.find({value: regex}, {"value": 1, "name": 1})
    .sort({"value" : 1})
    .limit(10);//Negative sort means descending.  

  currencyFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach( (item) => {
          console.log(item);
          let obj = {
            id: item._id,
            name: item.value,
            value: item.name
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);     
    }
  });
});


app.get('/prodServiceAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  var id = req.query["supplierId"];  
   
  var prodServiceFilter = ProductService
    .find({productName: regex, supplier: new ObjectId(id)}, {'productName': 1, 'price': 1, 'currency': 1})
    .sort({"productName" : 1})
    .limit(parseInt(MAX_PROD));//Negative sort means descending.
  
  prodServiceFilter.exec(function(err, data) {
  var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach( (item) => {
          let obj = {
            id: item._id,
            name: item.productName,
            price: item.price,
            currency: item.currency
          };
          
          result.push(obj);
        });
      }
     
      res.jsonp(result);
    }
  });
});


app.get('/capabilityInputAutocomplete', function(req, res, next) {
  var regex = new RegExp(req.query["term"], 'i');
  
  var capDescriptionFilter = Supplier.find({capabilityDescription: regex}, {'capabilityDescription': 1})
    .sort({"capabilityDescription" : 1})
    .limit(10)
  ;
  
  capDescriptionFilter.exec(function(err, data) {
    var result = [];
    
    if(!err) {
      if(data && data.length && data.length > 0) {
        data.forEach(item => {
          let obj = {
            id: item._id,
            name: item.capabilityDescription
          };
          
          result.push(obj);          
        });
      }
      
      res.jsonp(result);     
    }
  });
});


var buildResultSet = function(docs) {
    var result = [];
    for(var object in docs){
      result.push(docs[object]);
    }
    return result;
   }

app.get('/countryAutocompleted', function(req, res) {  
  var regex = new RegExp(req.query["term"], 'i');
  var query = Country.find({name: regex}, { 'name': 1 })/*.sort({"updated_at":-1}).sort({"created_at":-1})*/.limit(5);
 
  query.exec(function(err, items) {
    if (!err) {
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


// Database configuration and test data saving:
mongoose
  .connect(URI, {
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
    //app.listen(5000);
  })
  .catch(console.error);