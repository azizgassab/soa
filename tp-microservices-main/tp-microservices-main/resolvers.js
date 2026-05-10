const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const movieProto = grpc.loadPackageDefinition(
  protoLoader.loadSync('movie.proto')
).movie;

const tvProto = grpc.loadPackageDefinition(
  protoLoader.loadSync('tvShow.proto')
).tvShow;

const resolvers = {
  Query: {
    movie: (_, { id }) => {
      const client = new movieProto.MovieService(
        "localhost:50051",
        grpc.credentials.createInsecure()
      );

      return new Promise((resolve, reject) => {
        client.getMovie({ movie_id: id }, (err, res) => {
          if (err) reject(err);
          else resolve(res.movie);
        });
      });
    },

    movies: () => {
      const client = new movieProto.MovieService(
        "localhost:50051",
        grpc.credentials.createInsecure()
      );

      return new Promise((resolve, reject) => {
        client.searchMovies({ query: "" }, (err, res) => {
          if (err) reject(err);
          else resolve(res.movies);
        });
      });
    },

    tvShow: (_, { id }) => {
      const client = new tvProto.TVShowService(
        "localhost:50052",
        grpc.credentials.createInsecure()
      );

      return new Promise((resolve, reject) => {
        client.getTvshow({ tv_show_id: id }, (err, res) => {
          if (err) reject(err);
          else resolve(res.tv_show);
        });
      });
    },

    tvShows: () => {
      const client = new tvProto.TVShowService(
        "localhost:50052",
        grpc.credentials.createInsecure()
      );

      return new Promise((resolve, reject) => {
        client.searchTvshows({ query: "" }, (err, res) => {
          if (err) reject(err);
          else resolve(res.tv_shows);
        });
      });
    },
  },
};

module.exports = resolvers;