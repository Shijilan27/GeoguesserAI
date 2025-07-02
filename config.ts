// ======================================================================================
// IMPORTANT: PASTE YOUR MONGODB CONNECTION STRING BELOW
// ======================================================================================
// This file is used to configure the application since you cannot use a .env file.
// In a real-world production environment, you should always use environment variables
// for security reasons, rather than writing secrets into a code file.
// ======================================================================================

const config = {
  /**
   * Replace the placeholder below with your actual MongoDB connection string.
   * It should look like: "mongodb+srv://<user>:<password>@cluster.mongodb.net/myDatabase?retryWrites=true&w=majority"
   */
  MONGO_URI: "mongodb+srv://shijilan2712:9JkkHDTgAYibarSU@cluster0.c7pfg7z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",

  /**
   * The port the backend server will run on.
   */
  PORT: 3001,
};

export default config;
