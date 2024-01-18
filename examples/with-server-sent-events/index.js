const { join } = require("path");
const polka = require("polka");

const { PORT = 3000 } = process.env;
const dir = join(__dirname, "public");
const serve = require("serve-static")(dir);

polka()
	.use(serve)
	.get("/subscribe", (request, response) => {
		// "access-control-allow-origin" is required for cross-origin requests
		// as for any other requests. In our case, we are using localhost for both,
		// hence not needed.
		response.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive",
		});

		setInterval(() => {
			response.write("data: " + Date.now() + "\n\n");
		}, 1000);

		request.on("close", () => {
			response.end();
		});
	})
	.listen(PORT, () => {
		console.log(`> Running on http://localhost:${PORT}`);
	});
