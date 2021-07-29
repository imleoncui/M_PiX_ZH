const crypto = require('crypto');
const AccountRecoveryDemand = require('../models/AccountRecoveryDemand');

module.exports = async function sendEmailForAccountRecovery({
  studentInformation,
  temporaryKey = crypto.randomBytes(32).toString('base64'),
  schoolingRegistrationRepository,
  userRepository,
  accountRecoveryDemandRepository,
  mailService,
  checkScoAccountRecoveryService,
  userReconciliationService,
}) {
  const { email: newEmail } = studentInformation;

  const { firstName, id, userId, email: oldEmail } = await checkScoAccountRecoveryService.retrieveSchoolingRegistration({
    studentInformation,
    schoolingRegistrationRepository,
    userRepository,
    userReconciliationService,
  });

  await userRepository.isEmailAvailable(newEmail);

  const accountRecoveryDemand = new AccountRecoveryDemand({
    userId,
    schoolingRegistrationId: id,
    newEmail,
    oldEmail,
    used: false,
    temporaryKey,
  });
  await accountRecoveryDemandRepository.save(accountRecoveryDemand);

  await mailService.sendAccountRecoveryEmail({
    firstName,
    email: newEmail,
    temporaryKey,
  });
};