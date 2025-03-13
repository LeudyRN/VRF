const router = require("express").Router();

router.get("/", (req, res) => {
res.send("sing")
});

module.exports = router;