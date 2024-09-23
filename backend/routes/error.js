// error.js
// Function to simulate errors based on probability
const errorProbability = parseFloat(process.env.ERROR_PROBABILITY || "0.0");

function maybeThrowRandomError() {
    const randomValue = Math.random();
    if (randomValue < errorProbability) {
        return true;
    }
    return false;
}

module.exports = {
    maybeThrowRandomError,
};