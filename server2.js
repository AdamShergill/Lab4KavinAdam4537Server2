const http = require("http");
const urlModule = require("url");

const dictionary = new Map();

const server = http.createServer((req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  const { method, url } = req;
  const parsedUrl = urlModule.parse(url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === "/api/definitions") {
    let body = [];

    req.on("data", (chunk) => {
      body.push(chunk);
    });

    req.on("end", () => {
      body = Buffer.concat(body).toString();

      // Handle GET request
      if (method === "GET") {
        const queryParams = parsedUrl.query;
        const word = queryParams.word;
        const definition = dictionary.get(word);
        res.writeHead(200, headers);
        res.end(JSON.stringify({ word: word, definition: definition || "Word not found" }));
        return;
      }

      // Handle POST request
      if (method === "POST") {
        try {
          const jsonData = JSON.parse(body);
          const { word, definition } = jsonData;

          if (!word || !definition || typeof word !== "string" || typeof definition !== "string") {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ error: "Invalid input. Word and definition must be non-empty strings." }));
            return;
          }

          if (dictionary.has(word)) {
            res.writeHead(409, headers);
            res.end(JSON.stringify({ error: `The word '${word}' already exists.` }));
            return;
          }

          dictionary.set(word, definition);
          res.writeHead(201, headers);
          res.end(JSON.stringify({ message: `Word '${word}' added to dictionary` }));
          return;
        } catch (e) {
          console.error(e);
          res.writeHead(400, headers);
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }
      }

      // If none of the above, send method not allowed
      res.writeHead(405, headers);
      res.end(JSON.stringify({ error: "Method not allowed" }));
    });
  } else {
    // If not the API endpoint, send not found
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
