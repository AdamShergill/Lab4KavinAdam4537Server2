/**
 * Chat GPT was used to comment all of the code 
 * Chat GPT was also used in the code to respond to preflight options requests.
 * 
 */

const http = require("http");
const urlModule = require("url");

// Initialize dictionary as an array to store word-definition objects
let dictionary = [];
let totalRequests = 0; // Counter for total number of requests

const server = http.createServer((req, res) => {
  totalRequests++; // Increment total requests on each call

  // Set CORS headers to ensure cross-origin requests are handled
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Respond to preflight OPTIONS requests by confirming that the requested methods are allowed
  // Chat Gpt provided this code
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Extract the method and URL from the request
  const { method, url } = req;

  // Parse the URL to get query parameters and pathname
  const parsedUrl = urlModule.parse(url, true);
  const pathname = parsedUrl.pathname;

  // Process GET and POST requests on "/api/definitions" path
  if (pathname === "/api/definitions") {

    // Handle GET requests to fetch a word's definition
    if (method === "GET") {
      const { word } = parsedUrl.query; // Extract the word being searched for
      const entry = dictionary.find((entry) => entry.word === word); // Find the entry in the dictionary
      res.writeHead(200, { "Content-Type": "application/json" });
      if (entry) {
        // If the word is found, return the word and its definition
        res.end(JSON.stringify({ word: entry.word, definition: entry.definition, totalRequests, totalEntries: dictionary.length }));
      } else {
        // If not found, inform the requester that the word was not found
        res.end(JSON.stringify({ error: "Word not found", totalRequests, totalEntries: dictionary.length }));
      }
    }

      // Handle POST requests to add a new word and its definition 
    else if (method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        // Collect data chunks into the body
        body += chunk.toString();
      });
      req.on("end", () => {
        // Once all data is received, try to parse it as JSON
        try {
          const { word, definition } = JSON.parse(body);
          // Validate the inputs
          if (!word || typeof word !== "string" || !definition || typeof definition !== "string") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid input. Both word and definition must be strings." }));
            return;
          }
          // Check if the word already exists
          if (dictionary.some((entry) => entry.word === word)) {
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `The word '${word}' already exists.`, totalRequests, totalEntries: dictionary.length }));
          } else {
            // Add the new word and definition to the dictionary
            dictionary.push({ word, definition });
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              message: `Word '${word}' added successfully.`,
              totalRequests,
              totalEntries: dictionary.length
            }));
          }
        } catch (e) {
          // Handle JSON parsing errors
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Bad request. Unable to parse JSON." }));
        }
      });
    } else {
        // Respond with 405 Method Not Allowed if any other method is used
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } else {
    // Respond with 404 Not Found if the path does not match "/api/definitions"
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Start the server on the specified port from heroku or 8083 if not specified
const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
