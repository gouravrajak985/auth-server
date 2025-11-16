import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const useRS256 = process.env.USE_RS256 === "true";

let privateKey = null;
let publicKey = null;

if (useRS256) {
    const privPath = process.env.RSA_PRIVATE_KEY_PATH || "./keys/private.pem";
    const pubPath = process.env.RSA_PUBLIC_KEY_PATH || "./keys/public.pem";
    privateKey = fs.readFileSync(path.resolve(privPath), "utf8");
    publicKey = fs.readFileSync(path.resolve(pubPath), "utf8");
}

export function signAccessToken(payload) {
  const opts = { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" };
  if (useRS256) return jwt.sign(payload, privateKey, { algorithm: "RS256", ...opts });
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, opts);
}

export function signRefreshToken(payload) {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRY || "30", 10);
  const opts = { expiresIn: `${days}d` };
  if (useRS256) return jwt.sign(payload, privateKey, { algorithm: "RS256", ...opts });
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, opts);
}

export function verifyAccessToken(token) {
  if (!token) throw new ApiError(401, "No token provided");
  if (useRS256) return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  if (!token) throw new ApiError(401, "No token provided");
  if (useRS256) return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}