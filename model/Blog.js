const mongoose = require("mongoose");

// Create SCHEMA
const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
    dateline: {
      type: String,
    },
    category: {
      type: String,
    },
    link: {
      type: String,
    },
    slug: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create Model
const Blog = mongoose.model("Blog", BlogSchema);
module.exports = Blog;
