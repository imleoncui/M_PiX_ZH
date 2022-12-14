'use strict';
require('dotenv').config();

const smartRandom = require('../../api/lib/domain/services/smart-random/smart-random');
const dataFetcher = require('../../api/lib/domain/services/smart-random/data-fetcher');
const challengeRepository = require('../../api/lib/infrastructure/repositories/challenge-repository');
const skillRepository = require('../../api/lib/infrastructure/repositories/skill-repository');
const improvementService = require('../../api/lib/domain/services/improvement-service');
const pickChallengeService = require('../../api/lib/domain/services/pick-challenge-service');
const Answer = require('../../api/lib/domain/models/Answer');
const AnswerStatus = require('../../api/lib/domain/models/AnswerStatus');
const KnowledgeElement = require('../../api/lib/domain/models/KnowledgeElement');

function answerTheChallenge({ challenge, allAnswers, allKnowledgeElements, targetSkills, userId }) {
  const newAnswer = new Answer({ challengeId: challenge.id, result: AnswerStatus.OK });

  const _getSkillsFilteredByStatus = (knowledgeElements, targetSkills, status) => {
    return knowledgeElements
      .filter((knowledgeElement) => knowledgeElement.status === status)
      .map((knowledgeElement) => knowledgeElement.skillId)
      .map((skillId) => targetSkills.find((skill) => skill.id === skillId));
  };

  const newKnowledgeElements = KnowledgeElement.createKnowledgeElementsForAnswer({
    answer: newAnswer,
    challenge,
    previouslyFailedSkills: _getSkillsFilteredByStatus(allKnowledgeElements, targetSkills, KnowledgeElement.StatusType.INVALIDATED),
    previouslyValidatedSkills: _getSkillsFilteredByStatus(allKnowledgeElements, targetSkills, KnowledgeElement.StatusType.VALIDATED),
    targetSkills,
    userId,
  });

  return { updatedAnswers: [...allAnswers, newAnswer], updatedKnowledgeElements: [...allKnowledgeElements, ...newKnowledgeElements] };
}

async function _getReferentiel({
  assessment,
  answerRepository,
  challengeRepository,
  knowledgeElementRepository,
  skillRepository,
  improvementService,
}) {
  const { targetSkills, challenges } = await dataFetcher.fetchForCompetenceEvaluations({
    assessment,
    answerRepository,
    challengeRepository,
    knowledgeElementRepository,
    skillRepository,
    improvementService,
  });

  return { targetSkills, challenges };
}

async function _getChallenge({
  challenges,
  targetSkills,
  assessment,
  locale,
  knowledgeElements,
  allAnswers,
}) {
  const result = smartRandom.getPossibleSkillsForNextChallenge({
    knowledgeElements,
    challenges,
    targetSkills,
    lastAnswer: allAnswers[allAnswers.length - 1],
    allAnswers,
    locale,
  });

  const challenge = pickChallengeService.pickChallenge({
    skills: result.possibleSkillsForNextChallenge,
    randomSeed: assessment.id,
    locale: locale,
  });

  if (challenge) {
    console.log(challenge.id);
    console.log(challenge.skills[0].name);
  }

  return { challenge, hasAssessmentEnded: result.hasAssessmentEnded };
}

async function launchTest(argv) {

  const competenceId = argv.competenceId;
  const locale = argv.locale;
  let allAnswers = [];
  let knowledgeElements = [];
  const assessment = {
    id: null,
    competenceId,
    userId: 1,
  };

  const knowledgeElementRepository = {
    findUniqByUserId: () => [],
  };
  const answerRepository = {
    findByAssessment: () => [],
  };

  let isAssessmentOver = false;

  const { challenges, targetSkills } = await _getReferentiel({
    assessment,
    answerRepository,
    challengeRepository,
    knowledgeElementRepository,
    skillRepository,
    improvementService,
  });

  while (!isAssessmentOver) {

    const { challenge, hasAssessmentEnded } = await _getChallenge({
      challenges,
      targetSkills,
      assessment,
      locale,
      knowledgeElements,
      allAnswers,
    });

    if (challenge) {
      const { updatedAnswers, updatedKnowledgeElements } = answerTheChallenge({
        challenge,
        allAnswers,
        userId: assessment.userId,
        allKnowledgeElements: knowledgeElements,
        targetSkills,
      });
      allAnswers = updatedAnswers;
      knowledgeElements = updatedKnowledgeElements;
    }

    isAssessmentOver = hasAssessmentEnded;
  }

  process.exit(0);
}

module.exports = {
  answerTheChallenge,
  launchTest,
};
