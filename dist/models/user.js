"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true, maxlength: 1024 },
    role: { type: String, default: "user" },
});
const jwtPrivateKey = process.env.jwtPrivateKey;
userSchema.methods.generateAuthToken = function () {
    return jsonwebtoken_1.default.sign({ _id: this._id, role: this.role }, jwtPrivateKey);
};
const User = mongoose_1.default.model("User", userSchema);
const zodSchema = zod_1.z.object({
    username: zod_1.z.string({ message: "username is required" }).min(5).max(55),
    email: zod_1.z.string({ message: "Email is required" }).email().min(6).max(254),
    password: zod_1.z.string({ message: "Password is required" }).min(8).max(1024),
});
exports.default = { zodSchema, User };
