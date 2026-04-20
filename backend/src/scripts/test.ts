// for computing signatures
import crypto from "crypto";

const body = {}
const secret:string = "abc123"

const payload = JSON.stringify(body);

const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

console.log(expectedSignature)
