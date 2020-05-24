$(document).ready(function() {
  var messages = document.getElementById("messages");
  var socket = io();

  (function() {
    $("form").submit(function(e) {
      let li = document.createElement("li");
      let from = $('#from').val();
      let to = $('#to').val();
      let reqId = $('#reqId').val();

      
      socket.emit("chat message", {
        msg: $("#message").val(),
        from: from,
        to: to,
        reqId: reqId
      });
      
      e.preventDefault(); // prevents page reloading
      messages.appendChild(li).append($("#message").val());
      let span = document.createElement("span");
      messages.appendChild(span).append("From " + "UNITE User" + ": " + "Just now.");
      $("#message").val("");
      return false;
    });

    socket.on("received", (data) => {
      alert(data);
      let li = document.createElement("li");
      let span = document.createElement("span");
      var messages = document.getElementById("messages");
      messages.appendChild(li).append(data.message);
      messages.appendChild(span).append("From " + "UNITE User" + ": " + "Just now.");
      console.log("Hello, UNITE User!");
    });
  })();

  // fetching initial chat messages from the database
  (function() {
    
    fetch("/chat")
      .then(data => {
        return data.json();
      })
      .then(json => {
        json.map(data => {
          let li = document.createElement("li");
          let span = document.createElement("span");
          messages
            .appendChild(li)
            .append(data.message);
          
          messages
            .appendChild(span)
            .append("From " + data.sender + " to " + data.receiver
                    + " at: " + (data.time));
        });
      });
  })();

  //is typing...

  let messageInput = document.getElementById("message");
  let sender = document.getElementById("from");
  let receiver = document.getElementById("to");
  let reqId = document.getElementById("reqId");
  let typing = document.getElementById("typing");

  //isTyping event
  messageInput.addEventListener("keypress", () => {
    socket.emit("typing", { 
      user: "UNITE User", 
      from: sender,
      to: receiver,
      reqId: reqId,
      message: " is typing..." });
  });

  socket.on("notifyTyping", data => {
    typing.innerText = data.user + " types " + data.message;
    console.log(data.user + data.message);
  });

  //stop typing
  messageInput.addEventListener("keyup", () => {
    socket.emit("stopTyping", "");
  });

  socket.on("notifyStopTyping", () => {
    typing.innerText = "";
  });

})


