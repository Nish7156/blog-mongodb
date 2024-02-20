const axios = require("axios");
const cheerio = require("cheerio");
const cloudinary = require("cloudinary").v2; // Import Cloudinary
const Blog = require("../model/Blog");
const slugify = require("slugify"); // Import slugify library

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

//For pagination
// async function scrapeAajTak() {
//   const baseUrl = "https://www.gadgets360.com/news/";
//   const maxPages = 9;
//   const scrapedData = [];

//   for (let page = 1; page <= maxPages; page++) {
//     const url = `${baseUrl}page-${page}`;
//     const response = await axios.get(url);

//     if (response.status !== 200) {
//       console.error(`Failed to fetch data from ${url}`);
//       continue; // Skip to the next page if fetching fails
//     }

//     const $ = cheerio.load(response.data);

//     $(".story_list.row.margin_b30 li").each((index, element) => {
//       const title = $(element).find(".news_listing").text().trim();
//       const dateline = $(element).find(".dateline").text().trim();
//       const category = $(element).find(".catname").text().trim();
//       const link = $(element).find("a").attr("href");

//       // Make sure the link is absolute
//       const absoluteLink = new URL(link, baseUrl).toString();
//       scrapedData.push({ title, dateline, category, link: absoluteLink });
//     });

//     console.log(`Scraped data from page ${page}`);
//   }

//   console.log("Scraping completed!");

//   return scrapedData;
// }

async function scrapeAajTak() {
  const url = "https://www.gadgets360.com/news";
  const response = await axios.get(url);

  if (response.status !== 200) {
    console.error(`Failed to fetch data from ${url}`);
    return;
  }

  const $ = cheerio.load(response.data);

  const scrapedData = [];

  $(".story_list.row.margin_b30 li").each((index, element) => {
    const title = $(element).find(".news_listing").text().trim();
    const dateline = $(element).find(".dateline").text().trim();
    const category = $(element).find(".catname").text().trim();
    const link = $(element).find("a").attr("href");

    // Make sure the link is absolute
    const absoluteLink = new URL(link, url).toString();
    scrapedData.push({ title, dateline, category, link: absoluteLink });
  });

  console.log("Scraping completed!");

  return scrapedData;
}

async function saveToDatabase(scrapedData) {
  try {
    // Check if the link or title already exists in the database
    const existingBlogs = await Blog.find({
      $or: [
        { link: { $in: scrapedData.map((data) => data.link) } },
        { title: { $in: scrapedData.map((data) => data.title) } },
      ],
    });

    const existingLinksSet = new Set(existingBlogs.map((blog) => blog.link));
    const existingTitlesSet = new Set(existingBlogs.map((blog) => blog.title));

    // Filter out data that already exists in the database
    const newData = scrapedData.filter(
      (data) =>
        !existingLinksSet.has(data.link) && !existingTitlesSet.has(data.title)
    );

    if (newData.length === 0) {
      console.log("No new data to save.");
      return;
    }

    console.log(`${newData.length} new data found. Saving to database...`);

    // Iterate over scraped data
    for (const data of newData) {
      // Check if title and category are not empty
      if (!data.title.trim() || !data.category.trim()) {
        console.log("Skipping data with empty title or category:", data);
        continue;
      }

      // Generate unique slug from title
      const slug = slugify(data.title, { lower: true });

       // Extracting only the date part from dateline
      //  const datelineMatch = data.dateline.match(/\d{1,2} [A-Za-z]+ \d{4}/);
      //  const dateline = datelineMatch ? new Date(datelineMatch[0]) : undefined;
 

      // Fetch content from the link
      const response = await axios.get(data.link);
      const $ = cheerio.load(response.data);
      const description = $(".content_text.row.description")
        .find("p")
        .text()
        .trim();

      // Extract image source link
      const image = $(".fullstoryImage .heroimg").find("img").attr("src");

      let imageLink;

      // Check if the image with the same title already exists in the database
      const existingBlog = existingBlogs.find(
        (blog) => blog.title === data.title
      );
      if (existingBlog && existingBlog.image) {
        // Use existing image link
        imageLink = existingBlog.image;
      } else {
        // Upload image to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(image, {
          public_id: `${slug}_image`,
        });
        imageLink = cloudinaryResult.secure_url;
      }

      // Create a new Blog document with image link
      const blog = new Blog({
        title: data.title,
        description,
        image: imageLink,
        // link: data.link,
        category: data.category.toLowerCase(),
        dateline: data.dateline,
        slug: slug,
      });

      // Save the Blog document to the database
      console.log(blog);
      await blog.save();
    }

    console.log("Data saved successfully!");
  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
  }
}

module.exports = { scrapeAajTak, saveToDatabase };
