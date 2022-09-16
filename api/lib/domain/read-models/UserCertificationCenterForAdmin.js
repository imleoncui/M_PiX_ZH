class UserCertificationCenterForAdmin {
  constructor({
    id,
    certificationCenterId,
    certificationCenterName,
    certificationCenterType,
    certificationCenterExternalId,
  } = {}) {
    this.id = id;
    this.certificationCenterId = certificationCenterId;
    this.certificationCenterName = certificationCenterName;
    this.certificationCenterType = certificationCenterType;
    this.certificationCenterExternalId = certificationCenterExternalId;
  }
}

module.exports = UserCertificationCenterForAdmin;
