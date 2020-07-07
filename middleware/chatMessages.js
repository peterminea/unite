const generateMessage = (username, textData) => {
  var message = textData.message,
      from = textData.from? textData.from : 0,
      to = textData.to? textData.to : 1,
      fromName = textData.fromName? textData.fromName : "Sender",
      toName = textData.toName? textData.toName : "Receiver",
      reqId = textData.reqId? textData.reqId : 2,
      user = textData.user? textData.user : "UNITE User";
  
  return {
    username,
    message,
    from,
    to,
    fromName,
    toName,
    reqId,
    user,
    createdAt: new Date().getTime()
  }
}

const generateSimpleMessage = (username, message) => {
  return {
    username,
    message,
    createdAt: new Date().getTime()
  }
}

const generateLocationMessage = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime()
  }
}

module.exports = {generateMessage,
                  generateSimpleMessage,
                  generateLocationMessage};