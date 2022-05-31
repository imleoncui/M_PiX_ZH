const { expect, sinon, catchErr } = require('../../../../test-helper');
const { AuthenticationTokenRetrievalError } = require('../../../../../lib/domain/errors');
const settings = require('../../../../../lib/config');
const httpAgent = require('../../../../../lib/infrastructure/http/http-agent');

const poleEmploiAuthenticationService = require('../../../../../lib/domain/services/authentication/pole-emploi-authentication-service');
const PoleEmploiTokens = require('../../../../../lib/domain/models/PoleEmploiTokens');
const jsonwebtoken = require('jsonwebtoken');
const { POLE_EMPLOI } = require('../../../../../lib/domain/constants').SOURCE;

describe('Unit | Domain | Services | pole-emploi-authentication-service', function () {
  describe('#createAccessToken', function () {
    it('should create access token with user id and source', function () {
      // given
      const userId = 123;
      settings.authentication.secret = 'a secret';
      settings.poleEmploi.accessTokenLifespanMs = 1000;
      const accessToken = 'valid access token';
      const firstParameter = { user_id: userId, source: POLE_EMPLOI };
      const secondParameter = 'a secret';
      const thirdParameter = { expiresIn: 1 };
      sinon.stub(jsonwebtoken, 'sign').withArgs(firstParameter, secondParameter, thirdParameter).returns(accessToken);

      // when
      const result = poleEmploiAuthenticationService.createAccessToken(userId);

      // then
      expect(result).to.equal(accessToken);
    });
  });
  describe('#exchangeCodeForTokens', function () {
    beforeEach(function () {
      sinon.stub(httpAgent, 'post');
    });

    it('should return access token, refresh token, id token and validity period', async function () {
      // given
      sinon.stub(settings.poleEmploi, 'clientId').value('PE_CLIENT_ID');
      sinon.stub(settings.poleEmploi, 'tokenUrl').value('http://paul-emploi.net/api/token');
      sinon.stub(settings.poleEmploi, 'clientSecret').value('PE_CLIENT_SECRET');

      const poleEmploiTokens = new PoleEmploiTokens({
        accessToken: 'accessToken',
        expiresIn: 60,
        idToken: 'idToken',
        refreshToken: 'refreshToken',
      });

      const response = {
        isSuccessful: true,
        data: {
          access_token: poleEmploiTokens.accessToken,
          expires_in: poleEmploiTokens.expiresIn,
          id_token: poleEmploiTokens.idToken,
          refresh_token: poleEmploiTokens.refreshToken,
        },
      };
      httpAgent.post.resolves(response);

      // when
      const result = await poleEmploiAuthenticationService.exchangeCodeForTokens({
        code: 'AUTH_CODE',
        redirectUri: 'pix.net/connexion-paul-emploi',
      });

      // then
      const expectedData = `client_secret=PE_CLIENT_SECRET&grant_type=authorization_code&code=AUTH_CODE&client_id=PE_CLIENT_ID&redirect_uri=pix.net%2Fconnexion-paul-emploi`;
      const expectedHeaders = { 'content-type': 'application/x-www-form-urlencoded' };

      expect(httpAgent.post).to.have.been.calledWith({
        url: 'http://paul-emploi.net/api/token',
        payload: expectedData,
        headers: expectedHeaders,
      });
      expect(result).to.be.an.instanceOf(PoleEmploiTokens);
      expect(result).to.deep.equal(poleEmploiTokens);
    });

    context('when pole emploi tokens retrieval fails', function () {
      it('should log error and throw AuthenticationTokenRetrievalError', async function () {
        // given
        const code = 'code';
        const clientId = 'clientId';
        const redirectUri = 'redirectUri';

        const errorData = {
          error: 'invalid_client',
          error_description: 'Invalid authentication method for accessing this endpoint.',
        };

        const response = {
          isSuccessful: false,
          code: 400,
          data: errorData,
        };
        httpAgent.post.resolves(response);

        // when
        const error = await catchErr(poleEmploiAuthenticationService.exchangeCodeForTokens)({
          code,
          clientId,
          redirectUri,
        });

        // then
        expect(error).to.be.an.instanceOf(AuthenticationTokenRetrievalError);
        expect(error.message).to.equal(
          '{"error":"invalid_client","error_description":"Invalid authentication method for accessing this endpoint."}'
        );
      });
    });
  });
  describe('#getUserInfo', function () {
    it('should return email, firstName, lastName and external identity id', async function () {
      // given
      function generateIdToken(payload) {
        return jsonwebtoken.sign(
          {
            ...payload,
          },
          'secret'
        );
      }

      const given_name = 'givenName';
      const family_name = 'familyName';
      const nonce = 'bb041272-d6e6-457c-99fb-ff1aa02217fd';
      const idIdentiteExterne = '094b83ac-2e20-4aa8-b438-0bc91748e4a6';

      const idToken = generateIdToken({
        given_name,
        family_name,
        nonce,
        idIdentiteExterne,
      });

      // when
      const result = await poleEmploiAuthenticationService.getUserInfo(idToken);

      // then
      expect(result).to.deep.equal({
        firstName: given_name,
        lastName: family_name,
        nonce,
        externalIdentityId: idIdentiteExterne,
      });
    });
  });
});