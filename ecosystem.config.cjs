module.exports = {
  apps: [
    {
      name: "vyraconnect-backend",
      script: "./src/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        DB_HOST: "178.128.241.178",
        DB_USER: "master_zqpqahqrbk",
        DB_PASSWORD: "WYAkcTs7fgV8",
        DB_NAME: "vyraconnect"
      }
    }
  ]
};
