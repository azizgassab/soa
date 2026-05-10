const express = require('express');
const cors = require('cors');
const fs = require('fs');

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');

const resolvers = require('./resolvers');

const app = express();
app.use(cors());
app.use(express.json());

const movieProto = grpc.loadPackageDefinition(
  protoLoader.loadSync('movie.proto')
).movie;

const tvProto = grpc.loadPackageDefinition(
  protoLoader.loadSync('tvShow.proto')
).tvShow;

/* REST */

app.get("/movies", (req, res) => {
  const client = new movieProto.MovieService(
    "localhost:50051",
    grpc.credentials.createInsecure()
  );

  client.searchMovies({ query: "" }, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data.movies);
  });
});

app.get("/movies/:id", (req, res) => {
  const client = new movieProto.MovieService(
    "localhost:50051",
    grpc.credentials.createInsecure()
  );

  client.getMovie({ movie_id: req.params.id }, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data.movie);
  });
});

app.get("/tvshows", (req, res) => {
  const client = new tvProto.TVShowService(
    "localhost:50052",
    grpc.credentials.createInsecure()
  );

  client.searchTvshows({ query: "" }, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data.tv_shows);
  });
});

app.get("/tvshows/:id", (req, res) => {
  const client = new tvProto.TVShowService(
    "localhost:50052",
    grpc.credentials.createInsecure()
  );

  client.getTvshow({ tv_show_id: req.params.id }, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data.tv_show);
  });
});

/* GRAPHQL */

async function start() {
  const typeDefs = fs.readFileSync("./schema.gql", "utf8");

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use("/graphql", expressMiddleware(server));
}

start();

app.listen(3000, () => {
  console.log("API Gateway running on http://localhost:3000");
});