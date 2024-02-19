// scraper.js
const axios = require("axios");
const cheerio = require("cheerio");
const Blog = require("../model/Blog");

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
    // Check if the link already exists in the database
    const existingLinks = await Blog.find(
      { link: { $in: scrapedData.map((data) => data.link) } },
      { link: 1 }
    );
    const existingLinksSet = new Set(existingLinks.map((blog) => blog.link));

    // Filter out data that doesn't exist in the database
    const newData = scrapedData.filter(
      (data) => !existingLinksSet.has(data.link)
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

      // Fetch content from the link
      const response = await axios.get(data.link);
      const $ = cheerio.load(response.data);
      const description = $(".content_text.row.description")
        .find("p")
        .text()
        .trim();

      // Extract image source link
      const image = $(".fullstoryImage .heroimg")
        .find("img")
        .attr("src");

      // Create a new Blog document
      const blog = new Blog({
        title: data.title,
        description,
        image,
        link: data.link,
        category: data.category,
        dateline: data.dateline,
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
