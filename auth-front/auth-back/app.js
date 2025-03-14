const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require("mysql2");

require('dotenv').config();

const port = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());

app.use("/api/sing", require("./routes/sing"));
app.use("/api/login", require("./routes/login"));
app.use("/api/user", require("./routes/user"));
app.use("/api/todos", require("./routes/todos"));
app.use("/api/refresh-token", require("./routes/refreshToken"));
app.use("/api/singout", require("./routes/singout"));
app.use("/api/register-card", require("./routes/registerCard"));
app.use("/user", require("./routes/user"));


app.get("/", (req, res) => {
  res.send(" ");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
})