const sgMail = require('@sendgrid/mail');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require("bcryptjs");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;

const sendConfirmationEmail = (name, link, token, req) => {
    sgMail.send({
      from: 'peter@uniteprocurement.com',
      to: req.body.emailAddress, 
      subject: 'Account Verification Token',
      text: `Hello ${name},\n\nCongratulations for registering on the UNITE Public Procurement Platform!\n\nPlease verify your account by clicking the link: \nhttp://${req.headers.host}${link}${token}\n`
    }, function (err, resp) {
       if (err ) {
        return console.error(err.message);         
      }

      console.log('A verification email has been sent to ' + req.body.emailAddress  + '.');
      req.flash('success', 'A verification email has been sent to ' + req.body.emailAddress + '.\n');
      //req.flash("success", "Buyer signed up successfully!");        
    });
};


const sendCancellationEmail = (type, req, data, reason) => {//Buyer: placed orders, sent/received messages
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: req.body.emailAddress, 
    subject: `UNITE - ${type} Account Deletion Completed`,
    text: 
      `Hello ${req.body.organizationName},\n\nWe are sorry to see you go from the UNITE Public Procurement Platform!\n\nYour ${type} account has just been terminated and all your data such as ${data} and any user tokens saved by you have also been lost.\nWe hope to see you back in the coming future. If you have improvement suggestions for us, please send them to our e-mail address above.\n\nWith kind regards,\nThe UNITE Public Procurement Platform Team`,
    html: reason? '<p style="color: brown; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
  }, function (err, resp) {
     if (err ) {
      return console.log(err.message);
    }

      console.log('A termination confirmation email has been sent to ' + req.body.emailAddress + '.');
      req.flash('success', 'A termination confirmation email has been sent to ' + req.body.emailAddress + '.\n' + `${type} account finished off successfully!`);
    });
};


const sendCancelBidEmail = (req, victim, actor, victimMail, actorMail, victimType, actorType, reason) => {
        sgMail.send({
          from: "peter@uniteprocurement.com",
          to: victimMail,
          subject: "Bid request " + req.body.requestsName + " cancelled!",
          text:
            "Hello " + victim + 
            ",\n\nWe regret to inform you that your incoming Order named " + req.body.requestsName + " has been cancelled by "
            + "the " + actorType + actor + ".\nPlease contact them at " + actorMail + " for more"
            + " details.\nUNITE apologizes for any inconvenience that this issue may have caused to you."+ "\n\n"
            + "With kind regards,\nThe UNITE Public Procurement Platform Team",
            html: reason? '<p style="color: fuchsia; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
          }, function(err) {
            if(err) {
              return console.log(err.message);
            }
          
          var msg = "The Bid Request has been cancelled by the " + actorType + actor + '.\n' + victimType + victim + ' has been notified via e-mail about the Order cancellation.';
          console.log(msg);
          req.flash('success', msg);
      });
};


const sendInactivationEmail = (type, req, data, reason) => {
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: req.body.emailAddress, 
    subject: `UNITE - ${type} Account Inactivated`,
    text: 
      `Hello ${req.body.organizationName},\n\nYour ${type} account on the UNITE Public Procurement Platform has been inactivated. Some specific data such as ${data} has been deleted from our records. You will be active again at the next login on the Platform. \n\n.We hope to see you back soon. Please remember that your active presence on UNITE means a helping hand to others.\n\nIf you have improvement suggestions for us, please send them to our e-mail address above.\n\nWith kind regards,\nThe UNITE Public Procurement Platform Team`,
    html: reason? '<p style="color: brown; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
  }, function (err, resp) {
     if (err ) {
      return console.log(err.message);
    }

      console.log('An email about the account inactivation has been sent to ' + req.body.emailAddress + '.');
      req.flash('success', 'An email about the account inactivation has been sent to ' + req.body.emailAddress + '.\n' + `${type} account inactivated successfully!`);
    });
};


const resendTokenEmail = (user, token, link, req) => {
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: user.emailAddress,
    subject: 'Account Verification Token',
    text: "Hello,\n\n" +
          "Please verify your account by clicking the link: \nhttp://" +
          req.headers.host + link + token +
          "\n" }, function (err, info) {
       if (err ) {
        console.log(err);
      }  else {
        console.log('Message sent: ' + info.response);                
      }
      if (err) {
        return console.error(err.message);
      }
        
        req.flash('success', 'A verification email has been sent to ' + user.emailAddress + '.');      
      });  
};


const sendForgotPasswordEmail = (user, type, link, token, req) => {
      sgMail.send({
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password Reset - ' + type, 
        text:
            "Hello,\n\n" +
            "You have received this e-mail because you requested a Supervisor password reset on our UNITE platform." +
            " Please reset your password within 24 hours, by clicking the link: \nhttp://" + req.headers.host + link + token + "\n"
        }, function (err, resp) {
        if(err)
          return console.error(err.message);
        console.log('E-mail sent!')
        req.flash('success', 'An e-mail has been sent to ' + user.emailAddress + ' with password reset instructions.');
        
      });
};


const sendResetPasswordEmail = (user, type, req) => {
      sgMail.send({
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password changed - ' + type, 
        text: 'Hello,\n\n' 
        + 'You have successfully reset your '+ type + ' password on our UNITE platform'
        + 'for the account registered with ' + user.emailAddress + '. You can log in again.'        
      }, function (err, resp) {
        if(err)
          return console.error(err.message);
        console.log('E-mail sent!')
        req.flash('success', 'Your password has been successfully changed!');        
      });
};


const postSignInBody = (link, req, res) => {
  var dbLink = link + 's';
  const email = req.body.emailAddress;
  const password = req.body.password;
  console.log(email + ' ' + password);

  try {
  if(!email) {
    req.flash('error', 'No e-mail was given!');
    res.redirect(`/${link}/sign-in`);
  }
  else {
     MongoClient.connect(URL, {useUnifiedTopology: true},  function(err, db) {
      if (err)
        throw err;
      var dbo = db.db(BASE);
      
       dbo.collection(dbLink).findOne( { emailAddress: email, password: password },  (err, doc) => {
        if(err) 
          return console.error(err.message);

        if(!doc) {
          req.flash("error", "Invalid e-mail address or password!");
          res.redirect(`/${link}/sign-in`);
        }
          switch(link) {
            case 'buyer':
              req.session.buyer = doc;
              req.session.buyerId = doc._id;
              break;

            case 'supervisor':
              req.session.supervisor = doc;
              req.session.supervisorId = doc._id;
              break;

            case 'supplier':
              req.session.supplier = doc;
              req.session.supplierId = doc._id;
              break;

            default:
              break;
          }
         
          req.session.cookie.originalMaxAge = req.body.remember? null : 7200000;//Two hours.           
          req.session.save();
          bcrypt.compare(password, doc.password, async (err, doMatch) => {
            if(err)
              throw err;
            
            if (doMatch ||
              (password === doc.password && email === doc.emailAddress)
            ) {
              // Make sure the user has been verified
              if (!doc.isVerified)
                return res.status(401).send({
                  type: "not-verified",
                  msg:
                    "Your account has not been verified. Please check your e-mail for instructions."
                });
              
                if(doc.isActive != null && doc.isActive == false) {//Reactivate on login.
                    await dbo.collection(dbLink).updateOne( { _id: doc._id }, { $set: { isActive: true } }, function(err, obj) {});
                }
              
                db.close();
                setTimeout(function() {res.redirect(`/${link}`);}, 10);
            } else {
              req.flash("error", "Passwords and e-mail do not match!");
              res.redirect(`/${link}/sign-in`);
            }
          })
        })
      }).catch(console.error);;
    }
  } catch {
  }
};


module.exports = { sendConfirmationEmail, sendCancellationEmail, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendCancelBidEmail, postSignInBody };