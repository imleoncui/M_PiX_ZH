const {
  databaseBuilder,
  expect,
} = require('../../../test-helper');
const createServer = require('../../../../server');
const { featureToggles } = require('../../../../lib/config');

describe('Acceptance | Route | Account-recovery', () => {

  describe('POST /api/account-recovery', () => {
    let server;

    beforeEach(async () => {
      //given
      server = await createServer();
      featureToggles.isScoAccountRecoveryEnabled = true;
    });

    afterEach(async () => {
      await databaseBuilder.knex('account-recovery-demands').delete();
    });

    const studentInformation = {
      ineIna: '123456789AA',
      firstName: 'Jude',
      lastName: 'Law',
      birthdate: '2016-06-01',
    };

    const createUserWithSeveralSchoolingRegistrations = async ({ email = 'jude.law@example.net' } = {}) => {
      const user = databaseBuilder.factory.buildUser.withRawPassword({
        id: 8,
        firstName: 'Judy',
        lastName: 'Howl',
        email,
        username: 'jude.law0601',
      });
      const organization = databaseBuilder.factory.buildOrganization({
        id: 7,
        name: 'Collège Hollywoodien',
      });
      const latestOrganization = databaseBuilder.factory.buildOrganization({
        id: 2,
        name: 'Super Collège Hollywoodien',
      });
      databaseBuilder.factory.buildSchoolingRegistration({
        userId: user.id,
        ...studentInformation,
        nationalStudentId: studentInformation.ineIna,
        organizationId: organization.id,
        updatedAt: new Date('2005-01-01T15:00:00Z'),
      });
      databaseBuilder.factory.buildSchoolingRegistration({
        userId: user.id,
        ...studentInformation,
        nationalStudentId: studentInformation.ineIna,
        organizationId: latestOrganization.id,
        updatedAt: new Date('2010-01-01T15:00:00Z'),
      });
      await databaseBuilder.commit();
    };

    it('should return 204 HTTP status code', async () => {
      // given
      await createUserWithSeveralSchoolingRegistrations();
      const newEmail = 'new_email@example.net';

      const options = {
        method: 'POST',
        url: '/api/account-recovery',
        payload: {
          data: {
            attributes: {
              'ine-ina': studentInformation.ineIna,
              'first-name': studentInformation.firstName,
              'last-name': studentInformation.lastName,
              'birthdate': studentInformation.birthdate,
              email: newEmail,
            },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(204);
    });

    it('should return 400 if email already exists', async () => {
      // given
      const newEmail = 'new_email@example.net';
      await createUserWithSeveralSchoolingRegistrations({ email: newEmail });

      const options = {
        method: 'POST',
        url: '/api/account-recovery',
        payload: {
          data: {
            attributes: {
              'ine-ina': studentInformation.ineIna,
              'first-name': studentInformation.firstName,
              'last-name': studentInformation.lastName,
              'birthdate': studentInformation.birthdate,
              email: newEmail,
            },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(400);
      expect(response.result.errors[0].detail).to.equal('Cette adresse e-mail est déjà utilisée.');
    });

    it('should return 404 if IS_SCO_ACCOUNT_RECOVERY_ENABLED is not enabled', async () => {
      // given
      const server = await createServer();
      featureToggles.isScoAccountRecoveryEnabled = false;

      const newEmail = 'new_email@example.net';

      const options = {
        method: 'POST',
        url: '/api/account-recovery',
        payload: {
          data: {
            attributes: {
              'ine-ina': studentInformation.ineIna,
              'first-name': studentInformation.firstName,
              'last-name': studentInformation.lastName,
              'birthdate': studentInformation.birthdate,
              email: newEmail,
            },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(404);
    });

  });

});