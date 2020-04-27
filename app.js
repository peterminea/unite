//Basic declarations:
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

//Classes:
const BidRequest = require("./models/bidRequest");
const Buyer = require("./models/buyer");
const Supplier = require("./models/supplier");
const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

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
const supplierRoutes = require("./routes/supplier");
const buyerRoutes = require("./routes/buyer");
const supervisorRoutes = require("./routes/supervisor");

app.use("/", homeRoutes);
app.use("/supplier", supplierRoutes);
app.use("/buyer", buyerRoutes);
app.use("/supervisor", supervisorRoutes);


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
*/
   
/*
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
