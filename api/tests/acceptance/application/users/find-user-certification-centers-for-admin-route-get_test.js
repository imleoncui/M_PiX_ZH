const { databaseBuilder, expect, generateValidRequestAuthorizationHeader } = require('../../../test-helper');
const createServer = require('../../../../server');

describe('Acceptance | Route | Users', function () {
  describe('GET /api/admin/users/{id}/certification-centers', function () {
    it('should return 200 HTTP status code', async function () {
      // given
      const server = await createServer();
      const userId = databaseBuilder.factory.buildUser().id;

      const certificationCenter1 = databaseBuilder.factory.buildCertificationCenter({
        id: 1,
        name: 'Centre Takeo',
        type: 'SCO',
        externalId: '1234',
      });

      databaseBuilder.factory.buildCertificationCenterMembership({
        id: 234,
        certificationCenterId: certificationCenter1.id,
        userId,
        disabledAt: null,
      });

      const admin = databaseBuilder.factory.buildUser.withRole();

      await databaseBuilder.commit();

      const options = {
        method: 'GET',
        url: `/api/admin/users/${userId}/certification-centers`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(admin.id),
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
    });
  });
});
