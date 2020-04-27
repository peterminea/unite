const CLIENT_ID = "601718606962884609";
const CLIENT_SECRET = "1S63ldkAvKC0lvamunlDIkjrtH1g1yZ4";
const redirect = encodeURIComponent("https://go-panel.glitch.me/callback");

function getClientId() {
  return CLIENT_ID;
}
function getClientSecret() {
  return CLIENT_SECRET;
}
function getRedirect() {
  return redirect;
}

exports.getClientId = getClientId;
exports.getClientSecret = getClientSecret;
exports.getRedirect = getRedirect;
