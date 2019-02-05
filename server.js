/* ===== Server Class ==============================
|  Class with a constructor to start a server	   |
|  ===============================================*/

class Server {

    constructor() {

        'use strict';

        const Hapi = require('hapi');
        const BlockChainClass = require('./blockchain');
        const BlockClass = require('./block');
        let bc = new BlockChainClass.Blockchain();

        // Create a server with a host and port
        const server = Hapi.server({
            host: 'localhost',
            port: 8000
        });


        // Add the GET route at /block/ and take index pram from after the slash
        server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: async function(request, h) {
                let height = await bc.getBlockHeight().then((res) => { return res; });

                //check of the index is valid and return the error in JSON based on error type
                if ((request.params.index <= height) && (request.params.index >= 0)) {
                    let rep = await bc.getBlock(request.params.index).then((res) => { return res; });
                    return rep;
                } else if (request.params.index < 0) {
                    let data = {
                        Error: "Block doesnot exit",
                        SubError: "Block index must a positive number",
                        RequstedIndex: request.params.index,
                        CurrentChainHeight: height,
                    };
                    return data;
                } else if (request.params.index > height) {
                    let data = {
                        Error: "Block doesnot exit",
                        SubError: "Block index is higher than the current blockcahin height",
                        RequstedIndex: request.params.index,
                        CurrentChainHeight: height,
                    };
                    return data;
                } else if (!(parseInt(Number(request.params.index)) === request.params.index)) {
                    let data = {
                        Error: "Block doesnot exit",
                        SubError: "Block index not a number",
                        RequstedIndex: request.params.index,
                        CurrentChainHeight: height,
                    };
                    return data;
                }

                //return height;
            }
        });


        // Add the GET route at /block/ and take index pram from after the slash
        server.route({
            method: 'GET',
            path: '/stars/hash:{index}',
            handler: async function(request, h) {
                let rep = await bc.getBlockByHash(request.params.index)
                    .then((res) => { return res; })
                    .catch((res) => { return res; });
                return rep;
            }
        });


        // Add the GET route at /block/ and take index pram from after the slash
        server.route({
            method: 'GET',
            path: '/stars/address:{index}',
            handler: async function(request, h) {
                let rep = await bc.getAllByAddress(request.params.index)
                    .then((res) => { return res; })
                    .catch((res) => { return res; });
                return rep;
            }
        });


        // Add the POST route at /block and take body param from payload through x-www-from-urlencoded post
        server.route({
            method: 'POST',
            path: '/block',
            handler: async function(request, h) {

                //check if the body variable is set and defined
                if (request.payload.address && typeof request.payload.address == 'string') {

                    let rep = await bc.addBlock(request.payload)
                        .then((res) => { return (res); })
                        .catch((res) => { return (res); });

                    return rep;
                } else {
                    let data = {
                        Error: "block creation denied",
                        SubError: "block address data is missing",
                    };
                    return data;
                }
            }
        });


        server.route({
            method: 'POST',
            path: '/requestValidation',
            handler: async function(request, h) {

                //check if the body variable is set and defined
                if (request.payload.address && typeof request.payload.address == 'string') {
                    return bc.requestValidation(request.payload.address);
                } else {
                    let data = {
                        Error: "request denied",
                        SubError: "address data are missing",
                    };
                    return data;
                }
            }
        });



        server.route({
            method: 'POST',
            path: '/message-signature/validate',
            handler: async function(request, h) {

                //check if the body variable is set and defined
                if (request.payload.address && typeof request.payload.address == 'string' &&
                    request.payload.signature && typeof request.payload.signature == 'string') {
                    return bc.validateRequest(request.payload);
                } else {
                    let data = {
                        Error: "request denied",
                        SubError: "address or signatre data are missing",
                    };
                    return data;
                }
            }
        });


        // Start the server
        async function start() {

            try {
                await server.start();
            } catch (err) {
                console.log(err);
                process.exit(1);
            }

            console.log('Server running at:', server.info.uri);
        };

        start();
    }
}
module.exports.Server = Server;