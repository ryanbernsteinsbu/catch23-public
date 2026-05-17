const crypto = require("crypto");
const fs = require("fs");

const apiKey = "62d3d460d0a024bb";
const body = JSON.parse(fs.readFileSync(__dirname + "/preDraft.json", "utf8"));
const payload = JSON.stringify(body.league);

const signature = crypto
    .createHmac("sha256", apiKey)
    .update(payload)
    .digest("hex");

console.log("Signature:", signature);

// write the exact payload to a file so you can paste it into Postman
fs.writeFileSync(__dirname + "/payload.json", payload);
console.log("Payload written to payload.json");