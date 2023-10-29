const express = require("express");
const app = express();
const querystring = require("querystring");
const port = process.env.PORT || 3001;
const redirect_uri = "http://localhost:3001/auth";
const axios = require("axios");
require("dotenv").config();

let resultData = null;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  const data = {
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    scope: "user-top-read",
    show_dialog: true,
    redirect_uri,
  };

  res.redirect(
    "https://accounts.spotify.com/authorize?" + querystring.stringify(data)
  );
});

app.get("/auth", async (req, res) => {
  const code = req.query.code;

  const data = {
    code,
    redirect_uri,
    grant_type: "authorization_code",
  };
  const config = {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
        ).toString("base64"),
    },
  };

  const response = await sendGetTokenRequest(data, config);
  const topItems = await sendGetTopTracksRequest(response.data);

  resultData = topItems.data.items;
  res.redirect("/result");
});

async function sendGetTokenRequest(data, config) {
  return await axios.post(
    "https://accounts.spotify.com/api/token",
    data,
    config
  );
}

async function sendGetTopTracksRequest(data) {
  const url =
    "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0";
  const config = {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
    },
  };

  return await axios.get(url, config);
}

app.get("/result", (req, res) => {
  res.render("result", { data: resultData });
});

app.listen(port, () => {
  console.log("Server is running.");
});
