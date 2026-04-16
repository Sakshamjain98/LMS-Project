import "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 4040;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    const shutdown = (signal) => {
      console.log(`${signal} received. Closing server gracefully...`);
      server.close((err) => {
        if (err) {
          console.error("Error during server shutdown", err);
          process.exit(1);
        }
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Server failed to start", error);
    process.exit(1);
  }
};

startServer();