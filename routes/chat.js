const express = require("express");
const bodyParser = require("body-parser");
const connectdb = require("../dbconnect");
const Message = require("../models/message");
const sessionExit = require("../middleware/session-exit");
const chatController = require("../controllers/chat");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const ObjectId = require("mongodb").ObjectId;
const isAuth = require("../middleware/is-auth-supplier");
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: true
}));
//  
//router.get('/:supplierId/:buyerId/:requestId/:buyerName/:supplierName', isAuth, sessionExit, chatController.getIndex);
//if(1==2)

function chatter() {
  
}

router.route("/").get((req, res, next) =>  {
        res.setHeader("Content-Type", "application/json");
        res.statusCode  =  200;
  
        connectdb.then( (db)  =>  {
            Message.find({}).then( (chat)  =>  {
              //console.log('FAIDER ' + chat.length);
              
              if(chat && chat.length) {
                for(var message of chat) {                
                Supplier.find({_id: new ObjectId(message.from)}, {'companyName': 1} )
                  .then((data) => {
                    if(data && data.length) {
                      message.fromName = data[0].organizationName;
                      //console.log('MOIDER');

                      Buyer.find({_id: new ObjectId(message.to)}, {'organizationName': 1})
                        .then((data2) => {
                          if(data2 && data2.length) {
                          message.toName = data2[0].companyName;
                          //console.log('LOIVER');                          
                          }
                        });
                      }
                    });
                  }
                
                  setTimeout(function() {
                    res.json(chat);
                  }, 5000);
                }              
              /*
              var supplierFilter = Supplier.find({_id: new ObjectId(chat.from)}, {'companyName': 1} );
              var buyerFilter = Buyer.find({_id: new ObjectId(chat.to)}, {'organizationName': 1});
              
              buyerFilter.exec(function(err, data) {//organization company
                if(data && data.length) {
                  chat.fromName = data[0].organizationName;
                  console.log('MOIDER');                                   
                }
              });
              
              supplierFilter.exec(function(err, data) {//organization company
                if(data && data.length) {
                  chat.toName = data[0].companyName;
                  console.log('LOIVER');                  
                }
              });
              
            res.json(chat);*/
        });
    });
});

//router.get("/", /*isAuth,*/ sessionExit, chatController.getIndex);
module.exports = router;