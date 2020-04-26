const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

// const Supplier = require("./models/supplier");
const Buyer = require("./models/buyer");

const MONGODB_URI = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB"

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.use(express.static("public"));

app.set("view engine", "ejs"); // This will be used after developed ui.

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "26UNWwbu26FvXZTJQBkf45dLSV7gG9bx",
    resave: false,
    saveUninitialized: true,
    store: store
  })
);

const csrfProtection = csrf();

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

const homeRoutes = require("./routes/home");
const supplierRoutes = require("./routes/supplier");
const buyerRoutes = require("./routes/buyer");

app.use("/", homeRoutes);
app.use("/supplier", supplierRoutes);
app.use("/buyer", buyerRoutes);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(result => {
    /*
    //Here comes some mockup data for our model entities:
    
      const demoSupplier = new Supplier({
        companyName: "Demo Company",
        directorsName: "Demo Director",
        contactName: "Demo Contact Name",
        title: "Demo Title",
        emailAddress: "demo@email.com",
        password: "$2y$12$9W4TZzx6BK4XInW2vMcC9usoanEsviu4eHP/B.Nm/j0S7.XMKIaLa", // demopass
        companyRegistrationNo: "0",
        registrationCompany: "Demo Company",
        companyAddress: "Demo Address",
        storageLocation: "Demo Location",
        contactMobileNumber: "+000000000000",
        country: "A Demo European Country",
        industry: "Demo Industry",
        employeeNumbers: 5,
        lastYearTurnover: "5",
        website: "www.demo.dem",
        commodities: "Isopropylic Alcohol, Silica Gel",
        capabilityDescription: "Demo Description",
        relevantExperience: "Demo Experience",
        supportingInformation: "Default info in our documents",
        UNITETermsAndConditions: true,
        antibriberyAgreement: true
      });
  
    const demoBuyer = new Buyer({
      organizationName: "Demo Organization",
      organizationUniteID: "0",
      contactName: "Demo Contact Name",
      emailAddress: "demo@email.com",
      password: "$2y$12$agmsQ04zQOR4rdvS3polYubs8Gyd1bgLzaIW0Im/Q5JmpYx4hENAy",
      deptAgencyGroup: "Procter&Gamble Belgrad, SRB",
      qualification: "Basic qualification",
      address: "Demo Address",
      country: "Demo Country"
    });
    
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
    
    const demoRequirement = new Requirement({
      itemDescription: "Medium-size refrigerators",
      commodityList: "Zanussi, Bosch, Whirlpool",
      amount: "90",
      itemDescriptionLong: "Medium-size refrigerators for providing canteen long-term food to homeless people",
      itemDescriptionUrl: "https://www.democanteen.org",
      deliveryLocation: "Mariahilfestrasse 30, Vienna, Austria",
      deliveryRequirements: "Original papers attesting provenience of goods",
      complianceRequirements: "Certificate of authenticity",
      complianceRequirementsUrl: "https://iso9001.net"
    });
    
    */
    return null;
  })
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch(console.error);
