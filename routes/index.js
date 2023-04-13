const { Router } = require("express");
const router = Router();

const api = require("./api.js");
// Rate limit
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
});

router.get("/", (req, res) => {
  const page = {
    title: "Home",
  };

  res.status(200).render("home", {
    page,
  });
});

router.use("/api", limiter, api);

module.exports = router;
