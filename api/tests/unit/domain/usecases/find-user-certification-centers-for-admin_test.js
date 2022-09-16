const { expect, sinon } = require('../../../test-helper');
const findUserCertificationCentersForAdmin = require('../../../../lib/domain/usecases/find-user-certification-centers-for-admin');
const UserCertificationCenterForAdmin = require('../../../../lib/domain/read-models/UserCertificationCenterForAdmin');

describe('Unit | UseCase | find-user-certification-centers-for-admin', function () {
  let userCertificationCentersForAdminRepository;

  beforeEach(function () {
    userCertificationCentersForAdminRepository = { findByUserId: sinon.stub() };
  });

  it('should return the list of the user’s certification centers', async function () {
    // given
    const userCertificationCenters = [
      new UserCertificationCenterForAdmin({ certificationCenterName: 'Centre Shigeru' }),
      new UserCertificationCenterForAdmin({ certificationCenterName: 'Centre Kaede' }),
    ];
    userCertificationCentersForAdminRepository.findByUserId.withArgs(123).resolves(userCertificationCenters);

    // when
    const result = await findUserCertificationCentersForAdmin({
      userId: 123,
      userCertificationCentersForAdminRepository,
    });

    // then
    expect(result).to.equal(userCertificationCenters);
  });
});
