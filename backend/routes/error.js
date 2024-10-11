// error.js
// Function to simulate errors based on probability
const { diag } = require('@opentelemetry/api');
const errorProbability = parseFloat(process.env.ERROR_PROBABILITY || "0.0");

function maybeThrowRandomError() {
    const randomValue = Math.random();
    diag.debug(`Generated random value: ${randomValue}`);
    diag.debug(`Error probability: ${errorProbability}`);
    if (randomValue < errorProbability) {
        diag.debug('Random error will be thrown.');
        return true;
    }
    diag.debug('No error will be thrown.');
    return false;
}

module.exports = {
    maybeThrowRandomError,
};