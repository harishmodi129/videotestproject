const AWS = require("aws-sdk");
require("dotenv").config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap - southeast - 2",
  endpoint: new AWS.Endpoint("https://s3.ap-southeast-2.amazonaws.com"),
});

module.exports = s3;
