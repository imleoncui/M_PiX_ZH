const { expect, databaseBuilder } = require('../../../test-helper');
const userCertificationCentersForAdminRepository = require('../../../../lib/infrastructure/repositories/user-certification-centers-for-admin-repository');
const UserCertificationCenterForAdmin = require('../../../../lib/domain/read-models/UserCertificationCenterForAdmin');

describe('Integration | Repository | user-certification-centers-for-admin', function () {
  describe('#findByUserId', function () {
    context('When user does not exists', function () {
      it('should return an empty array', async function () {
        // given
        const userId = databaseBuilder.factory.buildUser({ id: 1 }).id;
        databaseBuilder.factory.buildCertificationCenterMembership({
          userId,
          disabledAt: null,
        });
        await databaseBuilder.commit();

        // when
        const userCertificationCenters = await userCertificationCentersForAdminRepository.findByUserId(2);

        // then
        expect(userCertificationCenters).to.be.an('array').that.is.empty;
      });
    });

    context('When user has no certification center membership', function () {
      it('should return an empty array', async function () {
        // given
        const user = databaseBuilder.factory.buildUser();

        const anotherUser = databaseBuilder.factory.buildUser();
        databaseBuilder.factory.buildCertificationCenterMembership({
          userId: anotherUser.id,
          disabledAt: null,
        });
        await databaseBuilder.commit();

        // when
        const userCertificationCenters = await userCertificationCentersForAdminRepository.findByUserId(user.id);

        // then
        expect(userCertificationCenters).to.be.an('array').that.is.empty;
      });
    });

    context('When user has certification center memberships', function () {
      it('should return the list of the user’s certification centers', async function () {
        // given
        const userId = databaseBuilder.factory.buildUser().id;

        const certificationCenter1 = databaseBuilder.factory.buildCertificationCenter({
          id: 1,
          name: 'Centre Takeo',
          type: 'SCO',
          externalId: '1234',
        });
        const certificationCenter2 = databaseBuilder.factory.buildCertificationCenter({
          id: 2,
          name: 'Centre Kaede',
          type: 'SCO',
          externalId: '12343',
        });
        const certificationCenter3 = databaseBuilder.factory.buildCertificationCenter({
          id: 3,
          name: 'Centre Shigeru',
          type: 'PRO',
          externalId: '1112343',
        });

        databaseBuilder.factory.buildCertificationCenterMembership({
          id: 234,
          certificationCenterId: certificationCenter1.id,
          userId,
          disabledAt: null,
        });
        databaseBuilder.factory.buildCertificationCenterMembership({
          id: 456,
          certificationCenterId: certificationCenter2.id,
          userId,
          disabledAt: '2001-01-01',
        });

        const anotherUserId = databaseBuilder.factory.buildUser().id;
        databaseBuilder.factory.buildCertificationCenterMembership({
          id: 678,
          certificationCenterId: certificationCenter3.id,
          userId: anotherUserId,
          disabledAt: null,
        });
        await databaseBuilder.commit();

        // when
        const userCertificationCenters = await userCertificationCentersForAdminRepository.findByUserId(userId);

        // then
        const expectedCertificationCenters = [
          new UserCertificationCenterForAdmin({
            id: 234,
            certificationCenterId: 1,
            certificationCenterName: 'Centre Takeo',
            certificationCenterType: 'SCO',
            certificationCenterExternalId: '1234',
          }),
        ];
        expect(userCertificationCenters).to.deepEqualArray(expectedCertificationCenters);
      });
    });
  });
});
