const { knex } = require('../../../db/knex-database-connection');
const UserCertificationCenterForAdmin = require('../../domain/read-models/UserCertificationCenterForAdmin');

module.exports = {
  async findByUserId(userId) {
    const certificationCenter = await knex('certification-center-memberships')
      .select({
        id: 'certification-center-memberships.id',
        certificationCenterId: 'certification-center-memberships.certificationCenterId',
        certificationCenterName: 'certification-centers.name',
        certificationCenterType: 'certification-centers.type',
        certificationCenterExternalId: 'certification-centers.externalId',
      })
      .innerJoin(
        'certification-centers',
        'certification-centers.id',
        'certification-center-memberships.certificationCenterId'
      )
      .where('certification-center-memberships.userId', userId)
      .whereNull('certification-center-memberships.disabledAt');

    return certificationCenter.map((attributes) => new UserCertificationCenterForAdmin(attributes));
  },
};
