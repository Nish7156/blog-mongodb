const express = require("express");
const { allBlogs, createBlog } = require("../controllers/BlogCtr");
const router = express.Router();

router.post("/", createBlog);

router.get("/", allBlogs);

module.exports = router;