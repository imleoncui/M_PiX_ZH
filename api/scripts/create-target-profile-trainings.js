const { knex, disconnect } = require('../db/knex-database-connection');
const { parseCsvWithHeaderAndRequiredFields } = require('./helpers/csvHelpers');
const REQUIRED_FIELD_NAMES = ['trainingId', 'targetProfileId'];

async function prepareDataForInsert(rawTrainings) {
  return await rawTrainings.map(async ({ trainingId, targetProfileId }) => {
    return {
      targetProfileId: Number(targetProfileId.trim()),
      trainingId: Number(trainingId.trim()),
    };
  });
}

async function createTargetProfileTraining(targetProfileTraining) {
  return knex.batchInsert('target-profile-trainings', targetProfileTraining);
}

const isLaunchedFromCommandLine = require.main === module;

async function main() {
  console.log('Starting creating target-profile-trainings.');

  const filePath = process.argv[2];

  console.log('Reading and parsing csv data file... ');
  const csvData = await parseCsvWithHeaderAndRequiredFields({ filePath, requiredFieldNames: REQUIRED_FIELD_NAMES });
  console.log('ok');

  console.log('Preparing data... ');
  const trainings = await prepareDataForInsert(csvData);
  console.log('ok');

  console.log('Insert target-profile-training in database...');
  await createTargetProfileTraining(trainings);
  console.log('\nDone.');
}

(async () => {
  if (isLaunchedFromCommandLine) {
    try {
      await main();
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  }
})();

module.exports = {
  createTargetProfileTraining,
  prepareDataForInsert,
};
