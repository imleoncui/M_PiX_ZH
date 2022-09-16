module.exports = async function findUserCertificationCentersForAdmin({
  userId,
  userCertificationCentersForAdminRepository,
}) {
  return userCertificationCentersForAdminRepository.findByUserId(userId);
};
