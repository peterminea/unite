// const mongodb = require("mongodb");
const request = require("request");
const mongoose = require("mongoose");
const User = require("../models/user");

// const MongoClient = mongodb.MongoClient;

// const connectionString =
// ("mongodb+srv://go-panel-main:deku5449-@go-panel-cluster-7zu13.mongodb.net/test?retryWrites=true&w=majority");

exports.getToken = (req, res) => {
  // console.log(req.params);
  var options = {
    method: "GET",
    url: "https://discordapp.com/api/v6/users/@me",
    headers: { authorization: `Bearer ${req.params.token}` }
  };

  request(options, (error, response, body) => {
    if (error) throw new Error(error);

    const data = JSON.parse(body);
    console.log(data);

    res.render("user", {
      name: data.username,
      discrirm: data.discriminator,
      mfa: data.mfa_enabled,
      id: data.id,
      email: data.email,
      guilds: data.connections,
      avatar: data.avatar
    });

    // Gelen data bilgileriyle yeni bir user oluştur
    const user = new User({
      discordId: data.id,
      username: data.username,
      discrim: data.discriminator,
      mfa: data.mfa_enabled,
      avatar: data.avatar
    });

    // Gelen datadaki id değerinini veritabanında var mı diye sorgula
    User.find({ discordId: data.id })
      .then(_user => {
        if (_user.length === 0) {
          // Veritabanında yoksa
          user
            .save() // Kullanıcıyı veritabanına kaydet
            .catch(console.error);
        } else {
          // console.log(_user);
        }
      })
      .catch(console.error);

    /*
    dbo
      .collection("panel-data")
      .find({ id: veri.id })
      .next()
      .then(user => {
        // Get user data with id
        if (!user) {
          // Check is it exists or not
          dbo.collection("panel-data").insertOne(veri, err2 => {
            if (err2) throw err;
            console.log("Veri eklendi!");
            db.close();
          });
        }
      })
      .catch(console.error);
      */

    /*
    MongoClient.connect(
      connectionString,
      { useNewUrlParser: true },
      { useUnifiedTopology: true },
      (err, db) => {
        if (err) throw err;
        var dbo = db.db("go-panel-data");
        var veri = {
          name: data.username,
          discrirm: data.discriminator,
          mfa: data.mfa_enabled,
          id: data.id,
          avatar: data.avatar
        };

        dbo
          .collection("panel-data")
          .find({ id: veri.id })
          .next()
          .then(user => {
            // Get user data with id
            if (!user) {
              // Check is it exists or not
              dbo.collection("panel-data").insertOne(veri, err2 => {
                if (err2) throw err;
                console.log("Veri eklendi!");
                db.close();
              });
            }
          })
          .catch(console.error);
      }
    );

    */
  });
};
