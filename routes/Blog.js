const express = require("express");
const {
  allBlogs,
  createBlog,
  getBlog,
  getBlogsByCategory,
  getBlogByCategoryAndSlug,
} = require("../controllers/BlogCtr");
const router = express.Router();

router.post("/", createBlog);

router.get("/", allBlogs);
router.get("/:slug", getBlog);
router.get("/category/:category", getBlogsByCategory);
router.get("/category/:category/:slug",getBlogByCategoryAndSlug);


module.exports = router;
