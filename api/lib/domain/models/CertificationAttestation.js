const { statuses } = require('../../infrastructure/repositories/clea-certification-status-repository');

class CertificationAttestation {
  constructor({
    id,
    firstName,
    lastName,
    birthdate,
    birthplace,
    isPublished,
    userId,
    date,
    deliveredAt,
    certificationCenter,
    pixScore,
    status,
    cleaCertificationStatus,
    resultCompetenceTree = null,
    verificationCode,
  } = {}) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthdate = birthdate;
    this.birthplace = birthplace;
    this.isPublished = isPublished;
    this.userId = userId;
    this.date = date;
    this.deliveredAt = deliveredAt;
    this.certificationCenter = certificationCenter;
    this.pixScore = pixScore;
    this.status = status;
    this.hasAcquiredCleaCertification = cleaCertificationStatus === statuses.ACQUIRED;
    this.resultCompetenceTree = resultCompetenceTree;
    this.verificationCode = verificationCode;
  }
}

module.exports = CertificationAttestation;
