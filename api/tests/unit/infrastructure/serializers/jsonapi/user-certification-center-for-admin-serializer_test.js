const { expect } = require('../../../../test-helper');
const serializer = require('../../../../../lib/infrastructure/serializers/jsonapi/user-certification-center-for-admin-serializer');
const UserCertificationCenterForAdmin = require('../../../../../lib/domain/read-models/UserCertificationCenterForAdmin');

describe('Unit | Serializer | JSONAPI | user-certification-center-for-admin-serializer', function () {
  describe('#serialize', function () {
    it('should convert to JSON', function () {
      // given
      const certificationCenters = [
        new UserCertificationCenterForAdmin({
          certificationCenterExternalId: '12345',
          certificationCenterId: 2,
          certificationCenterName: 'Centre Kaede',
          certificationCenterType: 'SCO',
        }),
      ];

      // when
      const json = serializer.serialize(certificationCenters);

      // then
      expect(json).to.deep.equal({
        data: [
          {
            attributes: {
              'certification-center-external-id': '12345',
              'certification-center-id': 2,
              'certification-center-name': 'Centre Kaede',
              'certification-center-type': 'SCO',
            },
            type: 'user-certification-center-memberships',
          },
        ],
      });
    });
  });
});
