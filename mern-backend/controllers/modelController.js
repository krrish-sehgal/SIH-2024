const AWS = require("aws-sdk");
const fs = require("fs");
const s3 = new AWS.S3();
const kms = new AWS.KMS();

exports.getEncryptedModel = (req, res, next) => {};
