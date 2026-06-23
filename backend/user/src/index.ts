import express from "express";

const app = express();
const port = 500;
app.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});
