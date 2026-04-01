import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// explicitly set the type, else it will be "any" in other files
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// tells typescript its a global var and ts and eslint wont get mad
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // Preserve connection across hot reloads in development
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }

  clientPromise = global._mongoClientPromise;
} else {
  // Normal connection in production
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;