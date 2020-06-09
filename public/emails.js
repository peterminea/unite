const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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


const sendCancellationEmail = (type, req, data) => {//Buyer: placed orders, sent/received messages
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: req.body.emailAddress, 
    subject: `UNITE - ${type} Account Deletion Completed`,
    text: 
      `Hello ${req.body.organizationName},\n\nWe are sorry to see you go from the UNITE Public Procurement Platform!\n\nYour ${type} account has just been terminated and all your data such as ${data} and any user tokens saved by you have also been lost.\nWe hope to see you back in the coming future. If you have improvement suggestions for us, please send them to our e-mail address above.\n\nWith kind regards,\nThe UNITE Public Procurement Platform Team`
  }, function (err, resp) {
     if (err ) {
      return console.log(err.message);
    }

      console.log('A termination confirmation email has been sent to ' + req.body.emailAddress + '.');
      req.flash('success', 'A termination confirmation email has been sent to ' + req.body.emailAddress + '.\n' + `${type} account finished off successfully!`);
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


const sendCancelBidEmail = (req, victim, actor, victimMail, actorMail, victimType, actorType) => {
        sgMail.send({
          from: "peter@uniteprocurement.com",
          to: victimMail,
          subject: "Bid request " + req.body.requestsName + " cancelled!",
          text:
            "Hello " + victim + 
            ",\n\nWe regret to inform you that your incoming Order named " + req.body.requestsName + " has been cancelled by "
            + "the " + actorType + actor + ".\nPlease contact them at " + actorMail + " for more"
            + " details.\nUNITE apologizes for any inconvenience that this issue may have caused to you."+ "\n\n"
            + "With kind regards,\nThe UNITE Public Procurement Platform Team"
          }, function(err) {
            if(err) {
              return console.log(err.message);
            }
          
          var msg = "The Bid Request has been cancelled by the " + actorType + actor + '.\n' + victimType + victim + ' has been notified via e-mail about the Order cancellation.';
          console.log(msg);
          req.flash('success', msg);
      });
};


module.exports = { sendConfirmationEmail, sendCancellationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendCancelBidEmail };