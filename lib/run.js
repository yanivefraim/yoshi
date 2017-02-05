const chalk = require('chalk');
const {watchMode} = require('./utils');

function format(time) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

function delta(start) {
  const end = new Date();
  const time = end.getTime() - start.getTime();

  return [end, time];
}

module.exports = options => (...tasks) => {
  return Promise.all(tasks.map(task => {
    const start = new Date();

    console.log(`[${format(start)}] ${chalk.bgGreen('Starting')} '${task.name}'...`);

    return task(options)
      .then(() => {
        const [end, time] = delta(start);
        console.log(`[${format(end)}] ${chalk.bgCyan('Finished')} '${task.name}' after ${time} ms`);
      })
      .catch(error => {
        const [end, time] = delta(start);
        console.log(`[${format(end)}] ${chalk.bgRed('Failed')} '${task.name}' after ${time} ms`);

        if (error) {
          console.log(error);
        }

        if (!watchMode()) {
          process.exit(1);
        }
      });
  }));
};
