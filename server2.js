const http = require("http");
const urlModule = require("url");

// Initialize dictionary as a Map to store words and definitions
const dictionary = new Map();

const server = http.createServer((req, res) => {
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
      // Handle word definition retrieval
      const queryParams = parsedUrl.query;
      const word = queryParams.word;
      const definition = dictionary.get(word);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ word, definition: definition || "Word not found" }));
    } else if (method === "POST") {
      // Handle new word definition storage
      let body = "";
      req.on("data", chunk => {
        body += chunk.toString(); // Convert Buffer to string
      });
      req.on("end", () => {
        const { word, definition } = JSON.parse(body);

        if (!word || !definition) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid input" }));
          return;
        }

        if (dictionary.has(word)) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Word already exists" }));
        } else {
          dictionary.set(word, definition);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Word added successfully" }));
        }
      });
    } else {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } else {
    // Handle not found error for other paths
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Listen on Heroku's provided port or 8083 if running locally
const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
