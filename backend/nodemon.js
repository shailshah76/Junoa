{
    "watch": [
      "server.js",
      "app.js",
      "models/",
      "routes/",
      "middleware/",
      "services/",
      "utils/",
      "config/",
      "controllers/"
    ],
    "ignore": [
      "node_modules/",
      "tests/",
      "coverage/",
      "logs/",
      "uploads/",
      "temp/",
      "docs/",
      "*.test.js",
      "*.spec.js",
      ".git/",
      ".nyc_output/",
      "README.md",
      "*.md"
    ],
    "ext": "js,json",
    "env": {
      "NODE_ENV": "development",
      "DEBUG": "junoa:*"
    },
    "delay": 1000,
    "verbose": true,
    "restartable": "rs",
    "colours": true,
    "legacyWatch": false,
    "pollingInterval": 100,
    "runOnChangeOnly": false,
    "signal": "SIGTERM",
    "stdout": true,
    "events": {
      "restart": "echo '🔄 Restarting server due to file changes...'",
      "crash": "echo '💥 Server crashed - waiting for file changes before restart'",
      "start": "echo '🚀 Server started successfully'",
      "quit": "echo '👋 Server stopped'"
    }
  }