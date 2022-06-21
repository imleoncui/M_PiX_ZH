const { expect, generateValidRequestAuthorizationHeader, HttpTestServer, sinon } = require('../../../test-helper');

const securityPreHandlers = require('../../../../lib/application/security-pre-handlers');
const organizationLearnerUserAssociationController = require('../../../../lib/application/organization-learner-user-associations/organization-learner-user-association-controller');
const moduleUnderTest = require('../../../../lib/application/organization-learner-user-associations');

describe('Unit | Application | Router | organization-learner-user-associations-router', function () {
  const organizationId = 2;
  const studentId = '1234';
  const userId = 2;

  describe('PATCH /api/organizations/id/schooling-registration-user-associations/studentId', function () {
    const method = 'PATCH';
    const headers = {
      // TODO: Fix this the next time the file is edited.
      // eslint-disable-next-line mocha/no-setup-in-describe
      authorization: generateValidRequestAuthorizationHeader(userId),
    };

    context('when the user is authenticated', function () {
      it('should exist', async function () {
        // given
        sinon
          .stub(securityPreHandlers, 'checkUserIsAdminInSUPOrganizationManagingStudents')
          .callsFake((request, h) => h.response(true));
        sinon.stub(organizationLearnerUserAssociationController, 'updateStudentNumber').returns('ok');
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        const url = `/api/organizations/${organizationId}/schooling-registration-user-associations/${studentId}`;
        const payload = {
          data: {
            attributes: {
              'student-number': '1234',
            },
          },
        };
        // when
        const response = await httpTestServer.request(method, url, payload, null, headers);

        // then
        expect(response.statusCode).to.equal(200);
      });

      it('should return a 422 status error when student-number parameter is not a string', async function () {
        // given
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        const url = `/api/organizations/${organizationId}/schooling-registration-user-associations/${studentId}`;
        const payload = {
          data: {
            attributes: {
              'student-number': 1234,
            },
          },
        };

        // when
        const response = await httpTestServer.request(method, url, payload, null, headers);

        // then
        const responsePayload = JSON.parse(response.payload);
        expect(response.statusCode).to.equal(422);
        expect(responsePayload.errors[0].title).to.equal('Unprocessable entity');
        expect(responsePayload.errors[0].detail).to.equal('Un des champs saisis n’est pas valide.');
      });

      it('should return a 404 status error when organizationId parameter is not a number', async function () {
        // given
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        const url = `/api/organizations/FAKE_ORGANIZATION_ID/schooling-registration-user-associations/${studentId}`;
        const payload = {
          data: {
            attributes: {
              'student-number': '1234',
            },
          },
        };

        // when
        const response = await httpTestServer.request(method, url, payload, null, headers);

        // then
        const responsePayload = JSON.parse(response.payload);
        expect(response.statusCode).to.equal(404);
        expect(responsePayload.errors[0].title).to.equal('Not Found');
        expect(responsePayload.errors[0].detail).to.equal('Ressource non trouvée');
      });

      it('should return a 404 status error when studentId parameter is not a number', async function () {
        // given
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        const url = `/api/organizations/${organizationId}/schooling-registration-user-associations/FAKE_STUDENT_ID`;
        const payload = {
          data: {
            attributes: {
              'student-number': '1234',
            },
          },
        };

        // when
        const response = await httpTestServer.request(method, url, payload, null, headers);

        // then
        const responsePayload = JSON.parse(response.payload);
        expect(response.statusCode).to.equal(404);
        expect(responsePayload.errors[0].title).to.equal('Not Found');
        expect(responsePayload.errors[0].detail).to.equal('Ressource non trouvée');
      });
    });

    context('when the user is not authenticated', function () {
      it('should return an error when the user is not authenticated', async function () {
        // given
        sinon
          .stub(securityPreHandlers, 'checkUserIsAdminInSUPOrganizationManagingStudents')
          .callsFake((request, h) => h.response().code(403).takeover());
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        const url = `/api/organizations/${organizationId}/schooling-registration-user-associations/${studentId}`;
        const payload = {
          data: {
            attributes: {
              'student-number': '1234',
            },
          },
        };

        // when
        const response = await httpTestServer.request(method, url, payload, null, headers);

        // then
        expect(response.statusCode).to.equal(403);
      });
    });
  });

  describe('DELETE /api/schooling-registration-user-associations/{id}', function () {
    const method = 'DELETE';

    it('should return a HTTP status code 204', async function () {
      // given
      sinon.stub(securityPreHandlers, 'userHasAtLeastOneAccessOf').returns(() => true);
      sinon
        .stub(organizationLearnerUserAssociationController, 'dissociate')
        .callsFake((request, h) => h.response('ok').code(204));
      const httpTestServer = new HttpTestServer();
      await httpTestServer.register(moduleUnderTest);

      const url = '/api/schooling-registration-user-associations/1';

      // when
      const response = await httpTestServer.request(method, url, null);

      // then
      expect(response.statusCode).to.equal(204);
    });

    it('should return a HTTP status code 403 when user does not have rights to Pix Admin', async function () {
      // given
      sinon
        .stub(securityPreHandlers, 'userHasAtLeastOneAccessOf')
        .returns((request, h) => h.response().code(403).takeover());
      const httpTestServer = new HttpTestServer();
      await httpTestServer.register(moduleUnderTest);

      const url = '/api/schooling-registration-user-associations/1';

      // when
      const response = await httpTestServer.request(method, url, null);

      // then
      expect(response.statusCode).to.equal(403);
    });

    it('should return a HTTP status code 400 if id parameter is not a number', async function () {
      // given
      const httpTestServer = new HttpTestServer();
      await httpTestServer.register(moduleUnderTest);

      const url = '/api/schooling-registration-user-associations/ABC';

      // when
      const response = await httpTestServer.request(method, url, null);

      // then
      expect(response.statusCode).to.equal(400);
    });
  });

  context('Routes /admin', function () {
    describe('DELETE /api/admin/schooling-registration-user-associations/{id}', function () {
      it('should return a HTTP status code 204 when user role is "SUPER_ADMIN"', async function () {
        // given
        sinon.stub(securityPreHandlers, 'checkUserHasRoleSuperAdmin').callsFake((request, h) => h.response(true));
        sinon
          .stub(securityPreHandlers, 'checkUserHasRoleSupport')
          .callsFake((request, h) => h.response({ errors: new Error('forbidden') }).code(403));
        sinon
          .stub(organizationLearnerUserAssociationController, 'dissociate')
          .callsFake((request, h) => h.response('ok').code(204));
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(
          'DELETE',
          '/api/admin/schooling-registration-user-associations/1'
        );

        // then
        sinon.assert.calledOnce(securityPreHandlers.checkUserHasRoleSuperAdmin);
        sinon.assert.calledOnce(securityPreHandlers.checkUserHasRoleSupport);
        sinon.assert.calledOnce(organizationLearnerUserAssociationController.dissociate);
        expect(response.statusCode).to.equal(204);
      });

      it('should return a HTTP status code 204 when user role is "SUPPORT"', async function () {
        // given
        sinon
          .stub(securityPreHandlers, 'checkUserHasRoleSuperAdmin')
          .callsFake((request, h) => h.response({ errors: new Error('forbidden') }).code(403));
        sinon.stub(securityPreHandlers, 'checkUserHasRoleSupport').callsFake((request, h) => h.response(true));
        sinon
          .stub(organizationLearnerUserAssociationController, 'dissociate')
          .callsFake((request, h) => h.response('ok').code(204));
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(
          'DELETE',
          '/api/admin/schooling-registration-user-associations/1'
        );

        // then
        sinon.assert.calledOnce(securityPreHandlers.checkUserHasRoleSuperAdmin);
        sinon.assert.calledOnce(securityPreHandlers.checkUserHasRoleSupport);
        sinon.assert.calledOnce(organizationLearnerUserAssociationController.dissociate);
        expect(response.statusCode).to.equal(204);
      });

      it('should return a HTTP status code 403 when user does not have access (CERTIF | METIER)', async function () {
        // given
        sinon
          .stub(securityPreHandlers, 'checkUserHasRoleSuperAdmin')
          .callsFake((request, h) => h.response({ errors: new Error('forbidden') }).code(403));
        sinon
          .stub(securityPreHandlers, 'checkUserHasRoleSupport')
          .callsFake((request, h) => h.response({ errors: new Error('forbidden') }).code(403));
        sinon
          .stub(organizationLearnerUserAssociationController, 'dissociate')
          .callsFake((request, h) => h.response('ok').code(204));
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(
          'DELETE',
          '/api/admin/schooling-registration-user-associations/1'
        );

        // then
        sinon.assert.calledOnce(securityPreHandlers.checkUserHasRoleSuperAdmin);
        sinon.assert.calledOnce(securityPreHandlers.checkUserHasRoleSupport);
        sinon.assert.notCalled(organizationLearnerUserAssociationController.dissociate);
        expect(response.statusCode).to.equal(403);
      });

      it('should return a HTTP status code 400 if id parameter is not a number', async function () {
        // given
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(
          'DELETE',
          '/api/admin/schooling-registration-user-associations/ABC'
        );

        // then
        expect(response.statusCode).to.equal(400);
      });
    });
  });
});