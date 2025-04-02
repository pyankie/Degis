import express from "express";
import env from "dotenv";
env.config();

if (!process.env.jwtPrivateKey)
  throw new Error("FATAL: jwtPrivateKey not defined. ");

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
