const { jsonResponse } = require("../lib/jsonResponse");
const router = require("express").Router();

router.post("/", (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json(jsonResponse(400, {
      error: "Fields are required"
    }));
  }

  return res.status(200).json(jsonResponse(200, { message: "User created successfully" }));
});

module.exports = router;