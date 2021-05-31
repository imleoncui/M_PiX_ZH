const { expect } = require('../../../test-helper');
const PoleEmploiTokens = require('../../../../lib/domain/models/PoleEmploiTokens');

describe('Unit | Domain | Models | PoleEmploiTokens', () => {

  describe('#constructor', () => {

    it('should construct a model PoleEmploiTokens from attributes', () => {
      // given
      const attributes = {
        accessToken: 'accessToken',
        idToken: 'idToken',
        expiresIn: 60,
        refreshToken: 'refreshToken',
      };

      // when
      const poleEmploiTokens = new PoleEmploiTokens(attributes);

      // then
      expect(poleEmploiTokens).to.be.an.instanceof(PoleEmploiTokens);
      expect(poleEmploiTokens).to.deep.equal(attributes);
    });
  });
});
