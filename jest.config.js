const os = require('os');

function getMaxWorkers() {
  if (typeof os.availableParallelism === 'function') {
    return os.availableParallelism();
  } else {
    return Math.max(1, os.cpus().length - 1);
  }
}

module.exports = {
  maxWorkers: getMaxWorkers(),
  // outras configurações do jest que você tiver
};
