const Joi = require('joi')
  .extend(require('@joi/date'));
const { validateEntity } = require('../validators/entity-validator');
const _ = require('lodash');
const { ChallengeToBeNeutralizedNotFoundError, ChallengeToBeDeneutralizedNotFoundError } = require('../errors');
const AnswerStatus = require('./AnswerStatus');
const NeutralizationAttempt = require('./NeutralizationAttempt');

const states = {
  COMPLETED: 'completed',
  STARTED: 'started',
};

const certificationAssessmentSchema = Joi.object({
  id: Joi.number().integer().required(),
  userId: Joi.number().integer().required(),
  certificationCourseId: Joi.number().integer().required(),
  createdAt: Joi.date().required(),
  completedAt: Joi.date().allow(null),
  state: Joi.string().valid(states.COMPLETED, states.STARTED).required(),
  isV2Certification: Joi.boolean().required(),
  certificationChallenges: Joi.array().min(1).required(),
  certificationAnswersByDate: Joi.array().min(0).required(),
});

const MINIMUM_ACCEPTABLE_ANSWERING_RATE = 66;

class CertificationAssessment {

  constructor({
    id,
    userId,
    certificationCourseId,
    createdAt,
    completedAt,
    state,
    isV2Certification,
    certificationChallenges,
    certificationAnswersByDate,
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.certificationCourseId = certificationCourseId;
    this.createdAt = createdAt;
    this.completedAt = completedAt;
    this.state = state;
    this.isV2Certification = isV2Certification;
    this.certificationChallenges = certificationChallenges;
    this.certificationAnswersByDate = certificationAnswersByDate;

    validateEntity(certificationAssessmentSchema, this);
  }

  getCertificationChallenge(challengeId) {
    return _.find(this.certificationChallenges, { challengeId }) || null;
  }

  neutralizeChallengeByRecId(recId) {
    const challengeToBeNeutralized = _.find(this.certificationChallenges, { challengeId: recId });
    if (challengeToBeNeutralized) {
      challengeToBeNeutralized.neutralize();
    } else {
      throw new ChallengeToBeNeutralizedNotFoundError();
    }
  }

  neutralizeChallengeByNumberIfKoOrSkippedOrPartially(questionNumber) {
    const toBeNeutralizedChallengeAnswer = this.certificationAnswersByDate[questionNumber - 1];
    if (!toBeNeutralizedChallengeAnswer) {
      return NeutralizationAttempt.failure(questionNumber);
    }

    if (_isAnswerKoOrSkippedOrPartially(toBeNeutralizedChallengeAnswer.result.status)) {
      const challengeToBeNeutralized = _.find(this.certificationChallenges, { challengeId: toBeNeutralizedChallengeAnswer.challengeId });
      challengeToBeNeutralized.neutralize();
      return NeutralizationAttempt.neutralized(questionNumber);
    }

    return NeutralizationAttempt.skipped(questionNumber);
  }

  deneutralizeChallengeByRecId(recId) {
    const challengeToBeDeneutralized = _.find(this.certificationChallenges, { challengeId: recId });
    if (challengeToBeDeneutralized) {
      challengeToBeDeneutralized.deneutralize();
    } else {
      throw new ChallengeToBeDeneutralizedNotFoundError();
    }
  }

  listCertifiableBadgeKeysTaken() {
    return _(this.certificationChallenges)
      .filter((certificationChallenge) => certificationChallenge.isPixPlus())
      .uniqBy('certifiableBadgeKey')
      .map('certifiableBadgeKey')
      .value();
  }

  findAnswersAndChallengesForCertifiableBadgeKey(certifiableBadgeKey) {
    const certificationChallengesForBadge = _.filter(this.certificationChallenges, { certifiableBadgeKey });
    const challengeIds = _.map(certificationChallengesForBadge, 'challengeId');
    const answersForBadge = _.filter(this.certificationAnswersByDate, ({ challengeId }) => _.includes(challengeIds, challengeId));
    return {
      certificationChallenges: certificationChallengesForBadge,
      certificationAnswers: answersForBadge,
    };
  }

  isCompleted() {
    return this.state === states.COMPLETED;
  }

  hasUnsufficientAnsweringRateToBeScored() {
    const candidateAnsweringRate = (this.certificationAnswersByDate.length / this.certificationChallenges.length) * 100;
    return candidateAnsweringRate < MINIMUM_ACCEPTABLE_ANSWERING_RATE;
  }

  getChallengeRecIdByQuestionNumber(questionNumber) {
    return this.certificationAnswersByDate[questionNumber - 1]?.challengeId || null;
  }
}

function _isAnswerKoOrSkippedOrPartially(answerStatus) {
  const isKo = AnswerStatus.isKO(answerStatus);
  const isSkipped = AnswerStatus.isSKIPPED(answerStatus);
  const isPartially = AnswerStatus.isPARTIALLY(answerStatus);
  return (isKo || isSkipped || isPartially);
}

CertificationAssessment.states = states;
CertificationAssessment.MINIMUM_ACCEPTABLE_ANSWERING_RATE = MINIMUM_ACCEPTABLE_ANSWERING_RATE;

module.exports = CertificationAssessment;
