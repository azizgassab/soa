const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const movieProto = grpc.loadPackageDefinition(
  protoLoader.loadSync('movie.proto')
).movie;

const movieService = {
  getMovie: (call, callback) => {
    callback(null, {
      movie: {
        id: call.request.movie_id,
        title: "Film Test",
        description: "Description film test"
      }
    });
  },

  searchMovies: (call, callback) => {
    callback(null, {
      movies: [
        { id: "1", title: "Film 1", description: "Desc 1" },
        { id: "2", title: "Film 2", description: "Desc 2" }
      ]
    });
  }
};

const server = new grpc.Server();
server.addService(movieProto.MovieService.service, movieService);

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => console.log("Movie service running on 50051")
);