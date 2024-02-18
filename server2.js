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

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const { method, url } = req;
  const parsedUrl = urlModule.parse(url, true);
  const pathname = parsedUrl.pathname;

  // Process GET and POST requests on "/api/definitions" path
  if (pathname === "/api/definitions") {
    if (method === "GET") {
      const { word } = parsedUrl.query;
      const entry = dictionary.find((entry) => entry.word === word);
      res.writeHead(200, { "Content-Type": "application/json" });
      if (entry) {
        res.end(JSON.stringify({ word: entry.word, definition: entry.definition }));
      } else {
        res.end(JSON.stringify({ error: "Word not found" }));
      }
    } else if (method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        const { word, definition } = JSON.parse(body);
        if (!word || typeof word !== "string" || !definition || typeof definition !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid input. Both word and definition must be strings." }));
          return;
        }
        if (dictionary.some((entry) => entry.word === word)) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `The word '${word}' already exists.` }));
        } else {
          dictionary.push({ word, definition });
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            message: `Word '${word}' added successfully.`,
            totalRequests,
            totalEntries: dictionary.length
          }));
        }
      });
    } else {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
