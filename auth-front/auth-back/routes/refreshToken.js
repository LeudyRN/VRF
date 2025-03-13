const router = require("express").Router();

router.get("/", (req, res) => {
res.send("refresh token")
});

module.exports = router;