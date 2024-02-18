const http = require("http");
const url = require("url");

let dictionary = []; // Array to store word-definition objects
let totalRequests = 0; // Counter to track the total number of requests

const server = http.createServer((req, res) => {
  totalRequests++; // Increment total requests on each call
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff"
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  res.writeHead(200, headers);

  if (pathname === "/api/definitions") {
    if (req.method === "GET") {
      const { word } = parsedUrl.query;
      const entry = dictionary.find(entry => entry.word === word);
      if (entry) {
        res.end(JSON.stringify({ word: entry.word, definition: entry.definition }));
      } else {
        res.end(JSON.stringify({ error: "Word not found." }));
      }
    } else if (req.method === "POST") {
      let body = '';
      req.on('data', chunk => body += chunk).on('end', () => {
        try {
          const { word, definition } = JSON.parse(body);
          if (!word || !definition || typeof word !== 'string' || typeof definition !== 'string') {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Invalid input. Both word and definition must be strings." }));
            return;
          }
          if (dictionary.some(entry => entry.word === word)) {
            res.writeHead(409);
            res.end(JSON.stringify({ error: "Word already exists." }));
          } else {
            dictionary.push({ word, definition });
            res.writeHead(201); // Resource created
            res.end(JSON.stringify({
              message: `Word '${word}' added to dictionary.`,
              totalRequests: totalRequests,
              totalEntries: dictionary.length
            }));
          }
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Bad request. Unable to parse JSON." }));
        }
      });
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: "Method not allowed." }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

const PORT = process.env.PORT || 8083;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
