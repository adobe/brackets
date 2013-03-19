var fs = require('fs');

module.exports.spaces = 4;

function readFile(file, callback) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            try {
                var obj = JSON.parse(data);
                callback(null, obj);
            } catch (err2) {
                callback(err2, null);
            }
        }
    })
}

function readFileSync(file) {
    var data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
}

function writeFile(file, obj, callback) {
    var str = '';
    try {
        str = JSON.stringify(obj, null, module.exports.spaces);
    } catch (err) {
        callback(err, null);
    }
    fs.writeFile(file, str, callback);
}

function writeFileSync(file, obj) {
    var str = JSON.stringify(obj, null, module.exports.spaces);
    return fs.writeFileSync(file, str); //not sure if fs.writeFileSync returns anything, but just in case
}


module.exports.readFile = readFile;
module.exports.readFileSync = readFileSync;
module.exports.writeFile = writeFile;
module.exports.writeFileSync = writeFileSync;