const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use("/assets", express.static("assets"));
// use ejs and express layouts
app.set("view engine", "ejs");


// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const homeRoutes = require("./routes/home");
const userRoutes = require("./routes/user");

app.use("/", homeRoutes);
app.use("/user", userRoutes);

// set static files (css and images, etc) location
app.use(express.static(`${__dirname}/site`));

mongoose.connect("mongodb+srv://go-panel-main:deku5449-@go-panel-cluster-7zu13.mongodb.net/go-panel?retryWrites=true&w=majority").then(result => {
    app.listen(3000);
}).catch(console.error);