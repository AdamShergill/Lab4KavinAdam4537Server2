const http = require("http");
const urlModule = require("url");

const dictionary = new Map();

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { method, url } = req;
  const parsedUrl = urlModule.parse(url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === "/api/definitions") {
    if (method === "GET") {
      const queryParams = parsedUrl.query;
      const word = queryParams.word;

      let definition = dictionary.get(word);
      res.end(
        JSON.stringify({
          word: word,
          definition: definition || "Word not found",
        })
      );

      console.log("GET request received for word search");
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
          res.end(JSON.stringify({ message: `Word '${word}' added to dictionary` }));
        } catch (e) {
          console.error(e);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });

      console.log("POST request received for adding a word");
    } else {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Listening on the port provided by by heroku or 8083 for local development
const PORT = process.env.PORT || 8083;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
