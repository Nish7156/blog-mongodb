const express = require("express");
const app = express();
const cron = require("node-cron");

const { scrapeAajTak, saveToDatabase } = require("./utils/scraper");
//
const apiError = require("./utils/apiError");
const { globalErrHandler } = require("./utils/globalErrHandler");

// access environment variables
require("dotenv").config();

// connect to database
require("./config/database");

// middleware
app.use(express.json()); // pass income payload

// routes
const userRouters = require("./routes/User");
const authRouters = require("./routes/Auth");
const categoryRouters = require("./routes/Category");
const postRouters = require("./routes/Post");
const commentRouters = require("./routes/Comment");
const blogRouters = require("./routes/Blog");

// routes middlware
app.use("/api/users", userRouters);
app.use("/api/auth", authRouters);
app.use("/api/categories", categoryRouters);
app.use("/api/posts", postRouters);
app.use("/api/blogs", blogRouters);
app.use("/api/comments", commentRouters);

// 404 error
app.all("*", (req, res, next) => {
  // create error
  const err = new apiError(`Can't find this route ${req.originalUrl}`, 400);
  // send it to Global errors handling middlware
  next(err);
});

// Global Error Handlers Middleware
app.use(globalErrHandler);

async function startScrapingAndSaving() {
  try {
    const scrapedData = await scrapeAajTak();
    await saveToDatabase(scrapedData);
    console.log("Scraping and saving completed.");
  } catch (error) {
    console.error("Error occurred during scraping:", error);
    process.exit(1);
  }
}

// Schedule the function to run every 4 hours
// cron.schedule("0 */4 * * *", () => {
//   startScrapingAndSaving();
// });

// cron.schedule("*/5 * * * * *", () => {
//   startScrapingAndSaving();
// });

// cron.schedule("0 */6 * * *", () => {
//   startScrapingAndSaving();
// });

cron.schedule(
  "0 12 * * *",
  () => {
    startScrapingAndSaving();
  },
  {
    timezone: "Asia/Kolkata", // Mumbai timezone
  }
);
// startScrapingAndSaving();

// Listen To Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});
