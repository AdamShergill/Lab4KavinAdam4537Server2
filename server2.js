const http = require("http");
const host = "localhost";
const port = 8083;
const urlModule = require("url");

const dictionary = new Map();

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { method, url } = req;
  const parsedUrl = urlModule.parse(url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === "/words") {
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

      console.log("GET request received on /words");
    } else if (method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const jsonData = JSON.parse(body);
          const { word, definition } = jsonData;

          if (
            !word ||
            !definition ||
            typeof word !== "string" ||
            typeof definition !== "string" ||
            !isNaN(Number(word)) ||
            !isNaN(Number(definition))
          ) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error:
                  "Invalid input. Word and definition must be non-empty strings.",
              })
            );
            return;
          }

          dictionary.set(word, definition);
          res.end(JSON.stringify({ message: "Word added to dictionary" }));
        } catch (e) {
          console.error(e);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });

      console.log("POST request received on /words");
    } else {
      res.end(JSON.stringify({ message: "Method not allowed on /words" }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
