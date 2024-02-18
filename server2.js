const http = require("http");
const urlModule = require("url");

const dictionary = new Map();

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
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

  // Endpoint for '/api/definitions'
  if (pathname === "/api/definitions") {
    // Handle GET request
    if (method === "GET") {
      const queryParams = parsedUrl.query;
      const word = queryParams.word;

      let definition = dictionary.get(word);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          word: word,
          definition: definition || "Word not found",
        })
      );

    // Handle POST request
    } else if (method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const jsonData = JSON.parse(body);
          const { word, definition } = jsonData;

          if (!word || !definition || typeof word !== "string" || typeof definition !== "string") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Invalid input. Word and definition must be non-empty strings.",
              })
            );
            return;
          }

          if (dictionary.has(word)) {
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `The word '${word}' already exists.` }));
            return;
          }

          dictionary.set(word, definition);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: `Word '${word}' added to dictionary` }));
        } catch (e) {
          console.error(e);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });

    } else {
      // Method not allowed
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } else {
    // Not found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Listening on the port provided by Heroku or 8083 for local development
const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
