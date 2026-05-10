const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const tvProto = grpc.loadPackageDefinition(
  protoLoader.loadSync('tvShow.proto')
).tvShow;

const tvService = {
  getTvshow: (call, callback) => {
    callback(null, {
      tv_show: {
        id: call.request.tv_show_id,
        title: "TV Test",
        description: "Description TV test"
      }
    });
  },

  searchTvshows: (call, callback) => {
    callback(null, {
      tv_shows: [
        { id: "1", title: "Serie 1", description: "Desc 1" },
        { id: "2", title: "Serie 2", description: "Desc 2" }
      ]
    });
  }
};

const server = new grpc.Server();
server.addService(tvProto.TVShowService.service, tvService);

server.bindAsync(
  "0.0.0.0:50052",
  grpc.ServerCredentials.createInsecure(),
  () => console.log("TV service running on 50052")
);