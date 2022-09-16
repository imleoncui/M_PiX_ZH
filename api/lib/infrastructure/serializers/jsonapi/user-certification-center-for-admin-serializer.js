const { Serializer } = require('jsonapi-serializer');

module.exports = {
  serialize(certificationCenter) {
    return new Serializer('user-certification-center-membership', {
      attributes: [
        'certificationCenterId',
        'certificationCenterName',
        'certificationCenterType',
        'certificationCenterExternalId',
      ],
    }).serialize(certificationCenter);
  },
};
