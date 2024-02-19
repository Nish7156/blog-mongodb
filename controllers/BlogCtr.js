const asyncHandler = require("express-async-handler");
const apiError = require("../utils/apiError");
const Blog = require("../model/Blog");
const handle = require("./handlersFactory");

exports.allBlogs = handle.getAll(Blog);

exports.createBlog = asyncHandler(async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    return next(new apiError("Failed to create blog post", 500));
  }
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);
  if (!blog) {
    return next(new apiError(`No Post for this id ${id}`));
  }

  if (blog.author.toString() !== req.user._id.toString()) {
    return next(new apiError(`You are not allowed to delete this post`, 403));
  }

  await Blog.findByIdAndDelete(id);

  res.status(204).send();
});
