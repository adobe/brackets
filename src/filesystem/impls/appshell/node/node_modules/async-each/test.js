each = require('async')

console.log('should be 1')

function sync(a, next) {
    next(null, a)
}

each.each([ 'alpha', 'bravo', 'charlie' ], sync, function (err, result) {
    console.log('should be 3')
})

console.log('should be 2')
