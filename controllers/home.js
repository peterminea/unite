const fetch = require("node-fetch");
const btoa = require("btoa");

const OAuth = require("../util/OAuth");

const CLIENT_ID = OAuth.getClientId();
const CLIENT_SECRET = OAuth.getClientSecret();
const redirect = OAuth.getRedirect();

exports.getIndex = (req, res) => {
  res.render("login");
};

exports.getLogin = (req, res) => {
  res.redirect(
    `https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=email%20identify%20guilds%20connections%20guilds.join&response_type=code&redirect_uri=${redirect}`
  );
};

const tokens = [];

const catchAsyncErrors = fn => (req, res, next) => {
  const routePromise = fn(req, res, next);
  if (routePromise.catch) {
    routePromise.catch(err => next(err));
  }
};

exports.getCallback = catchAsyncErrors(async (req, res) => {
  if (!req.query.code) throw new Error("NoCodeProvided");
  const { code } = req.query;
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const response = await fetch(
    `https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${creds}` }
    }
  );
  const json = await response.json();
  console.log(json);
  tokens.push(json.access_token);
  res.redirect(`/user/${json.access_token}`);
  console.log(tokens);
});
