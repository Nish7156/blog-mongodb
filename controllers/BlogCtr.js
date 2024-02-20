const asyncHandler = require("express-async-handler");
const apiError = require("../utils/apiError");
const Blog = require("../model/Blog");
const handle = require("./handlersFactory");

exports.allBlogs = handle.getAll(Blog);

exports.getBlog = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const blog = await Blog.findOne({ slug });

  if (!blog) {
    return next(new apiError(`No blog found with slug ${slug}`, 404));
  }

  res.status(200).json({ success: true, data: blog });
});

exports.getBlogsByCategory = asyncHandler(async (req, res, next) => {
  let { category } = req.params;

  const blogs = await Blog.find({ category });

  if (!blogs || blogs.length === 0) {
    return next(new apiError(`No blogs found in category '${category}'`, 404));
  }

  res.status(200).json({ success: true, data: blogs });
});

exports.createBlog = asyncHandler(async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    return next(new apiError("Failed to create blog post", 500));
  }
});

exports.getBlogByCategoryAndSlug = asyncHandler(async (req, res, next) => {
  let { category, slug } = req.params;

  const blog = await Blog.findOne({ category, slug });

  if (!blog) {
    return next(
      new apiError(
        `No blog found with category '${category}' and slug '${slug}'`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: blog });
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
