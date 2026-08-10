/**
 * Cloud Run entrypoint scaffold.
 *
 * POST /process { bucket, name } downloads the original, runs the pipeline,
 * and writes variants. The full Admin wiring lands when the service is
 * deployed; until then Next.js hosts the same algorithm for local emulators.
 */
import http from "node:http";

const port = Number(process.env.PORT ?? 8080);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && req.url === "/process") {
    res.writeHead(501, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error:
          "Deploy with Firebase Admin credentials. Local processing uses Next.js /api/assets/:id/process.",
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(port, () => {
  console.log(`image-pipeline listening on ${port}`);
});
