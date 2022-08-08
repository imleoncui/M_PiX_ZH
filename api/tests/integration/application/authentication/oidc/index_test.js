const { expect, sinon, generateValidRequestAuthorizationHeader } = require('../../../../test-helper');
const createServer = require('../../../../../server');
const oidcController = require('../../../../../lib/application/authentication/oidc/oidc-controller');
const querystring = require('querystring');

describe('Integration | Application | Route | OidcRouter', function () {
  let server;

  describe('GET /api/oidc/redirect-logout-url', function () {
    beforeEach(async function () {
      sinon.stub(oidcController, 'getRedirectLogoutUrl').callsFake((request, h) => h.response('ok').code(200));
      server = await createServer();
    });

    it('should return a response with HTTP status code 200', async function () {
      // given & when
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/api/oidc/redirect-logout-url?identity_provider=POLE_EMPLOI&logout_url_uuid=b45cb781-4e9a-49b6-8c7e-ff5f02e07720',
        headers: { authorization: generateValidRequestAuthorizationHeader() },
      });

      // then
      expect(statusCode).to.equal(200);
    });

    context('when missing required parameters', function () {
      context('all', function () {
        it('should return a response with HTTP status code 400', async function () {
          // given & when
          const { statusCode } = await server.inject({
            method: 'GET',
            url: '/api/oidc/redirect-logout-url',
            headers: { authorization: generateValidRequestAuthorizationHeader() },
          });

          // then
          expect(statusCode).to.equal(400);
        });
      });

      context('identity_provider', function () {
        it('should return a response with HTTP status code 400', async function () {
          // given & when
          const { statusCode } = await server.inject({
            method: 'GET',
            url: '/api/oidc/redirect-logout-url?logout_url_uuid=b45cb781-4e9a-49b6-8c7e-ff5f02e07720',
            headers: { authorization: generateValidRequestAuthorizationHeader() },
          });

          // then
          expect(statusCode).to.equal(400);
        });
      });

      context('logout_url_uuid', function () {
        it('should return a response with HTTP status code 400', async function () {
          // given & when
          const { statusCode } = await server.inject({
            method: 'GET',
            url: '/api/oidc/redirect-logout-url?identity_provider=POLE_EMPLOI',
            headers: { authorization: generateValidRequestAuthorizationHeader() },
          });

          // then
          expect(statusCode).to.equal(400);
        });
      });
    });

    context('when identity_provider parameter is not POLE_EMPLOI', function () {
      it('should return a response with HTTP status code 400', async function () {
        // given & when
        const { statusCode } = await server.inject({
          method: 'GET',
          url: '/api/oidc/redirect-logout-url?identity_provider=MY_IDP&logout_url_uuid=b45cb781-4e9a-49b6-8c7e-ff5f02e07720',
          headers: { authorization: generateValidRequestAuthorizationHeader() },
        });

        // then
        expect(statusCode).to.equal(400);
      });
    });
  });

  describe('POST /api/oidc/token', function () {
    beforeEach(async function () {
      sinon.stub(oidcController, 'authenticateOidcUser').callsFake((request, h) => h.response('ok').code(200));
      server = await createServer();
    });

    it('should return a response with HTTP status code 200', async function () {
      // given & when
      const headers = {
        'content-type': 'application/x-www-form-urlencoded',
      };

      const payload = querystring.stringify({
        identity_provider: 'OIDC',
        code: 'code',
        redirect_uri: 'redirect-uri',
        state_sent: 'state',
        state_received: 'state',
      });

      const { statusCode } = await server.inject({ method: 'POST', url: '/api/oidc/token', payload, headers });

      // then
      expect(statusCode).to.equal(200);
    });

    context('when missing required payload', function () {
      it('should return a response with HTTP status code 400', async function () {
        // given & when
        const headers = {
          'content-type': 'application/x-www-form-urlencoded',
        };
        const { statusCode } = await server.inject({ method: 'POST', url: '/api/oidc/token', payload: '', headers });

        // then
        expect(statusCode).to.equal(400);
      });
    });
  });
});