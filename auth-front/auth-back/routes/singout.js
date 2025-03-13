const { jsonResponse } = require("../lib/jsonResponse");

const router = require("express").Router();

router.post("/", (req, res) => {
  const {nombre, apellido, usuario, correo, contraseña, genero} = req.body;

  if (!! nombre || !!apellido || !!usuario || !!correo || !!contraseña || !!genero){
    return res.status(400).json(jsonResponse(400, {
      error: "Fields are required"
    }));
  }

//crear usuario
res
.status(200)
.json(jsonResponse(200, { message: "User created successfully"}));

res.send("singout")
});

module.exports = router;