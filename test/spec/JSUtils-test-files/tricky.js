// This function's name collides with an Object.prototype member
function toString() {
    return "";
}

// This function's name collides with an Array.prototype member
function length() {
    return 0;
}

// This function's name collides with an Object.prototype member
function hasOwnProperty() {
    return false;
}
