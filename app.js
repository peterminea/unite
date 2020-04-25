const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

mongoose
  .connect(
    "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(result => {
    app.listen(process.env.PORT);
  })
  .catch(console.error);
