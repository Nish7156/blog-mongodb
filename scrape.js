// scrape.js
const axios = require("axios");
const cheerio = require("cheerio");
const Blog = require("./model/Blog");

async function scrapeAajTak() {
  const url = "https://www.aajtak.in/";
  const response = await axios.get(url);

  if (response.status !== 200) {
    console.error(`Failed to fetch data from ${url}`);
    return;
  }

  const $ = cheerio.load(response.data);

  const scrapedData = [];

  $("li[data-tb-region-item]").each((index, element) => {
    const title = $(element).find("h3").text().trim();
    const link = $(element).find("a").attr("href");

    // Make sure the link is absolute
    const absoluteLink = new URL(link, url).toString();

    scrapedData.push({ title, link: absoluteLink });
    saveToDatabase(scrapedData);
  });

  console.log("Scraping completed!");
}

scrapeAajTak();

async function saveToDatabase(scrapedData) {
  try {
    // Iterate over scraped data
    for (const data of scrapedData) {
      // Create a new Blog document
      const blog = new Blog({
        title: data.title,
        description: "test", // You can add description logic if needed
        link: data.link,
        // Add other fields as needed
      });

      // Save the Blog document to the database
      console.log(blog);
      await blog.save();
    }

    console.log("Data saved successfullyx!");
  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
  }
}

async function createBlog(title, link, description = "No description provided") {
    try {
      // Create a new Blog document
      const blog = new Blog({
        title: title,
        description: description,
        link: link,
        // Add other fields as needed
      });
  
      // Save the Blog docudment to the database
      const savedBlog = await blog.save();
      console.log("Blog created and saved successfully:", savedBlog);
    } catch (error) {
      console.error("Error creating and saving blog:", error);
    }
  }
  
  // Example usage:
  createBlog("Example Blog Title", "https://example.com", "This is an example description.");