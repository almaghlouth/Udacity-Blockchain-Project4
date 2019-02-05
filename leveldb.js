const level = require('level');
const db = level('./miniChain', { valueEncoding: 'JSON' });

class LevelDB {

    constructor() {}

    parse() {
        db.createReadStream()
            .on('data', function(data) {
                console.log('Key: ' + data.key + '\nBlock =' + data.value);
            })
            .on('error', function(err) {
                console.log('ERROR! ', err)
            })
            .on('close', function() {})
            .on('end', function() {})
    }

    addNew(key, val) {
        db.put(key, val, function(err) {
            if (err) return console.log('Block ' + key + ' submission failed', err);
            console.log('\nKEY:\n' + key + '\nVALUE:\n' + val + '\nAdded to DB');
        });
    }

    getVal(key) {
        return new Promise(function(resolve, reject) {
            db.get(key).then(async function(response) {
                    await resolve(response);
                })
                .catch(function(result) {
                    console.log('ERROR! ' + result);
                })
        })
    }

    doCount() {
        var i = 0;
        return new Promise(function(resolve, reject) {
            db.createReadStream()
                .on('data', function(data) {
                    i++;
                })
                .on('error', function(err) {
                    reject(err);
                })
                .on('close', function() {
                    resolve(i);
                });
        });
    }

    hashToKey(hash) {
        var i = 0;
        var x = -1;
        var obj;
        return new Promise(function(resolve, reject) {
            db.createReadStream()
                .on('data', function(data) {
                    obj = JSON.parse(data.value);
                    if (obj.hash === hash) {
                        x = i;
                    }
                    i++;
                })
                .on('error', function(err) {
                    reject(err);
                })
                .on('close', function() {
                    resolve(x);
                });
        });
    }

    listFromAddress(address) {
        var i = 0;
        var list = [];
        var obj;
        return new Promise(function(resolve, reject) {
            db.createReadStream()
                .on('data', async function(data) {
                    obj = await JSON.parse(data.value);
                    if (obj.body.address === address) {
                        list.push(obj);
                    }
                })
                .on('error', function(err) {
                    reject(err);
                })
                .on('close', function() {
                    list = JSON.stringify(list).toString();
                    resolve(list);
                });
        });
    }

}


module.exports.LevelDB = LevelDB;