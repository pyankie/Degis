import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.status(400).send("hello from the other side");
});

app.listen(8000, () => console.log("app listening on port 8000"));
