class CleaCertifiedCandidate {
  constructor({
    firstName,
    lastName,
    email,
    birthdate,
    birthplace,
    birthPostalCode,
    birthINSEECode,
    birthCountry,
    sex,
    createdAt,
  } = {}) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.birthdate = birthdate;
    this.birthplace = birthplace;
    this.birthPostalCode = birthPostalCode;
    this.birthINSEECode = birthINSEECode;
    this.birthCountry = birthCountry;
    this.sex = sex;
    this.createdAt = createdAt;
  }

  get isBornInAForeignCountry() {
    if (this.birthINSEECode.startsWith('99')) {
      return true;
    }
    return false;
  }

  get geographicAreaOfBirthCode() {
    if (this.isBornInAForeignCountry) {
      const index = this.birthINSEECode.charAt(2);
      return `${index}00`;
    }
    return null;
  }

  get isBornInFrenchOutermostRegion() {
    if (this.birthINSEECode.startsWith('97') || this.birthINSEECode.startsWith('98')) {
      return true;
    }
    return false;
  }
}

module.exports = CleaCertifiedCandidate;
