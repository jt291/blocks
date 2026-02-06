const CONFIG = {
  debug: true,
  apiUrl: "https://api.example.com",
  timeout: 5000,
  features: {
    logging: true,
    caching: false
  }
};

function initConfig() {
  console.log("Config initialized:", CONFIG);
}
