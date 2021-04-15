const { expect, domainBuilder } = require('../../../../test-helper');
const serializer = require('../../../../../lib/infrastructure/serializers/jsonapi/certification-result-information-serializer');
const CertificationResultInformation = require('../../../../../lib/domain/read-models/CertificationResultInformation');
const Assessment = require('../../../../../lib/domain/models/Assessment');
const cleaCertificationStatusRepository = require('../../../../../lib/infrastructure/repositories/clea-certification-status-repository');

describe('Unit | Serializer | JSONAPI | certification-result-information-serializer', function() {

  describe('#serialize', function() {

    it('should serialize results of a certification', function() {
      // given
      const certificationCourseId = 123;
      const certificationIssueReport = domainBuilder.buildCertificationIssueReport({ certificationCourseId });
      const certificationIssueReports = [ certificationIssueReport ];
      const competenceMarks = [ domainBuilder.buildCompetenceMark() ];
      const certificationResultInformationDTO = {
        certificationCourseId,
        sessionId: 11,
        status: Assessment.states.COMPLETED,
        createdAt: new Date('2020-02-20T10:30:00Z'),
        completedAt: new Date('2020-02-20T11:00:00Z'),
        isPublished: true,
        isV2Certification: true,
        cleaCertificationStatus: cleaCertificationStatusRepository.statuses.NOT_PASSED,
        firstName: 'James',
        lastName: 'Watt',
        birthdate: '07-11-1950',
        birthplace: 'Somewhere',
        certificationIssueReports,
        assessmentId: 44,
        commentForCandidate: null,
        commentForOrganization: null,
        commentForJury: null,
        juryId: 1,
        pixScore: 555,
        competenceMarks,
      };
      const certificationResultInformation = new CertificationResultInformation(certificationResultInformationDTO);

      // when
      const serializedCertificationCourse = serializer.serialize(certificationResultInformation);

      // then
      const expectedSerializedCertification = {
        data: {
          id: certificationCourseId.toString(),
          type: 'certifications',
          attributes: {
            'session-id': certificationResultInformationDTO.sessionId,
            status: certificationResultInformationDTO.status,
            'created-at': new Date('2020-02-20T10:30:00Z'),
            'completed-at': new Date('2020-02-20T11:00:00Z'),
            'is-published': certificationResultInformationDTO.isPublished,
            'is-v2-certification': certificationResultInformationDTO.isV2Certification,
            'clea-certification-status': certificationResultInformationDTO.cleaCertificationStatus,
            'first-name': certificationResultInformationDTO.firstName,
            'last-name': certificationResultInformationDTO.lastName,
            birthdate: certificationResultInformationDTO.birthdate,
            birthplace: certificationResultInformationDTO.birthplace,
            'assessment-id': certificationResultInformationDTO.assessmentId,
            'comment-for-candidate': certificationResultInformationDTO.commentForCandidate,
            'comment-for-jury': certificationResultInformationDTO.commentForJury,
            'comment-for-organization': certificationResultInformationDTO.commentForOrganization,
            'jury-id': certificationResultInformationDTO.juryId,
            'pix-score': certificationResultInformationDTO.pixScore,
            'competences-with-mark': certificationResultInformationDTO.competenceMarks,
          },
          relationships: {
            'certification-issue-reports': {
              data: [{
                type: 'certificationIssueReports',
                id: certificationIssueReport.id.toString(),
              }],
            },
          },
        },
        included: [{
          type: 'certificationIssueReports',
          id: certificationIssueReport.id.toString(),
          attributes: {
            category: certificationIssueReport.category,
            description: certificationIssueReport.description,
            'is-action-required': certificationIssueReport.isActionRequired,
            'question-number': certificationIssueReport.questionNumber,
            subcategory: certificationIssueReport.subcategory,
          },
        }],
      };
      expect(serializedCertificationCourse).to.deep.equal(expectedSerializedCertification);
    });
  });
});