const { expect, domainBuilder } = require('../../../../test-helper');
const {
  getSessionCertificationResultsCsv,
  getDivisionCertificationResultsCsv,
  REJECTED_AUTOMATICALLY_COMMENT,
  getCleaCertifiedCandidateCsv,
} = require('../../../../../lib/infrastructure/utils/csv/certification-results');
const {
  PIX_EMPLOI_CLEA_V3,
  PIX_DROIT_MAITRE_CERTIF,
  PIX_DROIT_EXPERT_CERTIF,
  PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_INITIE,
  PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_CONFIRME,
  PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_AVANCE,
  PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_EXPERT,
  PIX_EDU_FORMATION_INITIALE_1ER_DEGRE_INITIE,
  PIX_EDU_FORMATION_INITIALE_1ER_DEGRE_CONFIRME,
  PIX_EDU_FORMATION_CONTINUE_1ER_DEGRE_AVANCE,
  PIX_EDU_FORMATION_CONTINUE_1ER_DEGRE_EXPERT,
} = require('../../../../../lib/domain/models/Badge').keys;

describe('Integration | Infrastructure | Utils | csv | certification-results', function () {
  context('#getSessionCertificationResultsCsv', function () {
    context('when no certification has passed complementary certifications', function () {
      it('should return correct csvContent without complementary certification informations', async function () {
        // given
        const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '1.1', level: 0 }),
          domainBuilder.buildCompetenceMark({ competence_code: '1.2', level: 1 }),
          domainBuilder.buildCompetenceMark({ competence_code: '1.3', level: 5 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 0 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];

        const certifResult = domainBuilder.buildCertificationResult.validated({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getSessionCertificationResultsCsv({ session, certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n' +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Validée";55;0;1;5;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";0;0;"RAS";777;"CentreCertif";"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });

      context('when certification has been rejected automatically', function () {
        it('should return correct csvContent with automatically rejected comment for organization', async function () {
          // given
          const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });

          const competencesWithMark = [
            domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
            domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
          ];

          const automaticallyRejectedCertificationResult = domainBuilder.buildCertificationResult.rejected({
            id: 456,
            lastName: 'Cambridge',
            firstName: 'Tom',
            birthdate: '1993-05-21',
            birthplace: 'TheMoon',
            externalId: 'TOTODGE',
            createdAt: new Date('2020-02-02'),
            pixScore: 66,
            commentForOrganization: null,
            competencesWithMark: competencesWithMark,
            complementaryCertificationCourseResults: [],
          });
          const certificationResults = [automaticallyRejectedCertificationResult];

          // when
          const result = await getSessionCertificationResultsCsv({ session, certificationResults });

          // then
          const expectedResult =
            '\uFEFF' +
            '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n' +
            `456;"Tom";"Cambridge";"21/05/1993";"TheMoon";"TOTODGE";"Rejetée";"0";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";0;0;"${REJECTED_AUTOMATICALLY_COMMENT}";777;"CentreCertif";"02/02/2020"`;
          expect(result).to.equal(expectedResult);
        });
      });
    });

    context('when certification is cancelled', function () {
      it('should return correct csvContent with cancelled status and dashes as Pix scores', async function () {
        // given
        const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];
        const certifResult = domainBuilder.buildCertificationResult.cancelled({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getSessionCertificationResultsCsv({ session, certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n' +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Annulée";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"RAS";777;"CentreCertif";"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
    });

    context('when at least one certification course is in error', function () {
      it('should return correct csvContent with error status and dashes as Pix scores', async function () {
        // given
        const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];
        const certifResult = domainBuilder.buildCertificationResult.error({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getSessionCertificationResultsCsv({ session, certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n' +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"En erreur";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"RAS";777;"CentreCertif";"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
    });

    context(`when at least one candidate has passed PIX_EMPLOI_CLEA_V3 certification`, function () {
      it(`should return correct csvContent with the PIX_EMPLOI_CLEA_V3 information`, async function () {
        // given
        const partnerKey = PIX_EMPLOI_CLEA_V3;
        const expectedHeader = 'Certification CléA Numérique';
        const label = 'CléA Numérique';
        const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];
        const certifResult = domainBuilder.buildCertificationResult.validated({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [
            domainBuilder.buildComplementaryCertificationCourseResult({ partnerKey, acquired: true, label }),
          ],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getSessionCertificationResultsCsv({ session, certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          `"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"${expectedHeader}";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n` +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Validée";"Validée";55;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";3;0;"RAS";777;"CentreCertif";"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
      it(`should return a cancelled PIX_EMPLOI_CLEA_V3 certification when certification pix is cancelled`, async function () {
        // given
        const partnerKey = PIX_EMPLOI_CLEA_V3;
        const expectedHeader = 'Certification CléA Numérique';
        const label = 'CléA Numérique';
        const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];
        const certifResult = domainBuilder.buildCertificationResult.cancelled({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [
            domainBuilder.buildComplementaryCertificationCourseResult({ partnerKey, acquired: true, label }),
          ],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getSessionCertificationResultsCsv({ session, certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          `"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"${expectedHeader}";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n` +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Annulée";"Annulée";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"RAS";777;"CentreCertif";"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
    });

    context('when there are several complementary certifications', function () {
      it('should return correct csvContent with complementary informations', async function () {
        // given
        const session = domainBuilder.buildSession({ id: 777, certificationCenter: 'CentreCertif' });
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];
        const certifResult = domainBuilder.buildCertificationResult.validated({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_DROIT_MAITRE_CERTIF,
              acquired: false,
              label: 'Pix+ Droit Maître',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 2,
              partnerKey: PIX_DROIT_EXPERT_CERTIF,
              acquired: true,
              label: 'Pix+ Droit Expert',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 3,
              partnerKey: PIX_EMPLOI_CLEA_V3,
              acquired: true,
              label: 'CléA Numérique',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_INITIE,
              acquired: true,
              label: 'Pix+ Édu 2nd degré Initié (entrée dans le métier)',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_CONFIRME,
              acquired: false,
              label: 'Pix+ Édu 2nd degré Confirmé',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_AVANCE,
              acquired: true,
              label: 'Pix+ Édu 2nd degré Avancé',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_EXPERT,
              acquired: false,
              label: 'Pix+ Édu 2nd degré Expert',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_INITIALE_1ER_DEGRE_INITIE,
              acquired: true,
              label: 'Pix+ Édu 1er degré Initié (entrée dans le métier)',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_INITIALE_1ER_DEGRE_CONFIRME,
              acquired: false,
              label: 'Pix+ Édu 1er degré Confirmé',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_CONTINUE_1ER_DEGRE_AVANCE,
              acquired: true,
              label: 'Pix+ Édu 1er degré Avancé',
            }),
            domainBuilder.buildComplementaryCertificationCourseResult({
              id: 1,
              partnerKey: PIX_EDU_FORMATION_CONTINUE_1ER_DEGRE_EXPERT,
              acquired: false,
              label: 'Pix+ Édu 1er degré Expert',
            }),
          ],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getSessionCertificationResultsCsv({ session, certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Certification Pix+ Droit Maître";"Certification Pix+ Droit Expert";"Certification CléA Numérique";"Certification Pix+ Édu 2nd degré Initié (entrée dans le métier)";"Certification Pix+ Édu 2nd degré Confirmé";"Certification Pix+ Édu 2nd degré Avancé";"Certification Pix+ Édu 2nd degré Expert";"Certification Pix+ Édu 1er degré Initié (entrée dans le métier)";"Certification Pix+ Édu 1er degré Confirmé";"Certification Pix+ Édu 1er degré Avancé";"Certification Pix+ Édu 1er degré Expert";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Centre de certification";"Date de passage de la certification"\n' +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Validée";"Rejetée";"Validée";"Validée";"Validée";"Rejetée";"Validée";"Rejetée";"Validée";"Rejetée";"Validée";"Rejetée";55;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";3;0;"RAS";777;"CentreCertif";"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
    });
  });
  context('#getDivisionCertificationResultsCsv', function () {
    context('when at least one candidate has passed a certification', function () {
      it('returns a csv without session informations', async function () {
        // given
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '1.1', level: 0 }),
          domainBuilder.buildCompetenceMark({ competence_code: '1.2', level: 1 }),
          domainBuilder.buildCompetenceMark({ competence_code: '1.3', level: 5 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 0 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];

        const certifResult = domainBuilder.buildCertificationResult.validated({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          sessionId: 777,
          complementaryCertificationCourseResults: [],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getDivisionCertificationResultsCsv({ certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Date de passage de la certification"\n' +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Validée";55;0;1;5;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";0;0;"RAS";777;"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
    });
    context('when certification has been rejected automatically', function () {
      it('should return correct csvContent with automatically rejected comment for organization', async function () {
        // given

        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];

        const certifResult = domainBuilder.buildCertificationResult.rejected({
          id: 456,
          lastName: 'Cambridge',
          firstName: 'Tom',
          birthdate: '1993-05-21',
          birthplace: 'TheMoon',
          externalId: 'TOTODGE',
          createdAt: new Date('2020-02-02'),
          pixScore: 66,
          sessionId: 777,
          commentForOrganization: null,
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [],
        });
        const certificationResults = [certifResult];

        // when
        const result = await getDivisionCertificationResultsCsv({ certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Date de passage de la certification"\n' +
          `456;"Tom";"Cambridge";"21/05/1993";"TheMoon";"TOTODGE";"Rejetée";"0";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";0;0;"${REJECTED_AUTOMATICALLY_COMMENT}";777;"02/02/2020"`;
        expect(result).to.equal(expectedResult);
      });
    });
    context('when at least one certification course is cancelled', function () {
      it('should return correct csvContent with cancelled status and dashes as Pix scores', async function () {
        // given
        const competencesWithMark = [
          domainBuilder.buildCompetenceMark({ competence_code: '5.1', level: 3 }),
          domainBuilder.buildCompetenceMark({ competence_code: '5.2', level: -1 }),
        ];
        const certifResult = domainBuilder.buildCertificationResult.cancelled({
          id: 123,
          lastName: 'Oxford',
          firstName: 'Lili',
          birthdate: '1990-01-04',
          birthplace: 'Torreilles',
          externalId: 'LOLORD',
          createdAt: new Date('2020-01-01'),
          pixScore: 55,
          sessionId: 777,
          commentForOrganization: 'RAS',
          competencesWithMark: competencesWithMark,
          complementaryCertificationCourseResults: [],
        });

        const certificationResults = [certifResult];

        // when
        const result = await getDivisionCertificationResultsCsv({ certificationResults });

        // then
        const expectedResult =
          '\uFEFF' +
          '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Statut";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Commentaire jury pour l’organisation";"Session";"Date de passage de la certification"\n' +
          '123;"Lili";"Oxford";"04/01/1990";"Torreilles";"LOLORD";"Annulée";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"RAS";777;"01/01/2020"';
        expect(result).to.equal(expectedResult);
      });
    });
  });
  context('#getCleaCertifiedCandidateCsv', function () {
    context('when at least one candidate has passed a clea certification', function () {
      it("returns a csv with candidate's information", async function () {
        // given
        const CleaCertifiedCandidate1 = domainBuilder.buildCleaCertifiedCandidate({
          firstName: 'Léane',
          lastName: 'Bern',
          email: 'princesse-lele@gg.fr',
          birthdate: '2001-05-10',
          birthplace: 'Paris',
          birthPostalCode: '75019',
          birthINSEECode: '75119',
          birthCountry: 'FRANCE',
          sex: 'F',
          createdAt: new Date('2020-02-01'),
        });
        const CleaCertifiedCandidate2 = domainBuilder.buildCleaCertifiedCandidate({
          firstName: 'Jean-Mi',
          lastName: 'Mi',
          email: 'jean-mi@coco.fr',
          birthdate: '2001-02-07',
          birthplace: 'Paris',
          birthPostalCode: '75015',
          birthINSEECode: '75115',
          birthCountry: 'FRANCE',
          sex: 'M',
          createdAt: new Date('2020-02-01'),
        });

        // when
        const result = await getCleaCertifiedCandidateCsv([CleaCertifiedCandidate1, CleaCertifiedCandidate2]);

        // then
        const headers =
          '"SIREN de l\'organisme";"Siret de l\'établissement";"Statut à l\'inscription";"Niveau d\'instruction";"Origine de la démarche";"Financeur";"Civilité";"Nom de naissance";"Nom d\'usage";"Prénom";"Email";"Téléphone";"Adresse";"Complément d\'adresse";"Ville";"Code postal";"Date de naissance";"Né à l\'étranger";"Zone géographique de naissance";"Né en collectivité d\'outre-mer";"Ville de naissance";"Code postal de naissance";"Date de passage";"CCPI";"Statut";"Obtention après la première évaluation ?"\n';
        const CleaCertifiedCandidate1Data =
          ';;;;;;"MME";"Bern";;"Léane";"princesse-lele@gg.fr";;;;;;"2001-05-10";"NON";;"NON";"Paris";"75019";"01/02/2020";"CléA Numérique by Pix";"CERTIFIE";\n';
        const CleaCertifiedCandidate2Data =
          ';;;;;;"M";"Mi";;"Jean-Mi";"jean-mi@coco.fr";;;;;;"2001-02-07";"NON";;"NON";"Paris";"75015";"01/02/2020";"CléA Numérique by Pix";"CERTIFIE";';

        const expectedResult = '\uFEFF' + headers + CleaCertifiedCandidate1Data + CleaCertifiedCandidate2Data;

        expect(result).to.equal(expectedResult);
      });
      context('when clea certified candidates are born in french outermost region', function () {
        it('should return csvContent with correct geographic area code and correct outermost born value', async function () {
          // given
          const CleaCertifiedCandidate = domainBuilder.buildCleaCertifiedCandidate({
            firstName: 'Léane',
            lastName: 'Bern',
            email: 'princesse-lele@gg.fr',
            birthdate: '2001-05-10',
            birthplace: 'STE MARIE',
            birthPostalCode: '97418',
            birthINSEECode: '97418',
            birthCountry: 'FRANCE',
            sex: 'F',
            createdAt: new Date('2020-02-01'),
          });

          // when
          const result = await getCleaCertifiedCandidateCsv([CleaCertifiedCandidate]);

          // then
          const headers =
            '"SIREN de l\'organisme";"Siret de l\'établissement";"Statut à l\'inscription";"Niveau d\'instruction";"Origine de la démarche";"Financeur";"Civilité";"Nom de naissance";"Nom d\'usage";"Prénom";"Email";"Téléphone";"Adresse";"Complément d\'adresse";"Ville";"Code postal";"Date de naissance";"Né à l\'étranger";"Zone géographique de naissance";"Né en collectivité d\'outre-mer";"Ville de naissance";"Code postal de naissance";"Date de passage";"CCPI";"Statut";"Obtention après la première évaluation ?"\n';
          const CleaCertifiedCandidateData =
            ';;;;;;"MME";"Bern";;"Léane";"princesse-lele@gg.fr";;;;;;"2001-05-10";"NON";;"OUI";"STE MARIE";"97418";"01/02/2020";"CléA Numérique by Pix";"CERTIFIE";';

          const expectedResult = '\uFEFF' + headers + CleaCertifiedCandidateData;

          expect(result).to.equal(expectedResult);
        });
      });
      context('when clea certified candidates are born in foreign country', function () {
        it('should return csvContent with correct foreign born value', async function () {
          // given
          const CleaCertifiedCandidate = domainBuilder.buildCleaCertifiedCandidate({
            firstName: 'Léane',
            lastName: 'Bern',
            email: 'princesse-lele@gg.fr',
            birthdate: '2001-05-10',
            birthplace: 'STE MARIE',
            birthPostalCode: '99416',
            birthINSEECode: '99416',
            birthCountry: 'BRESIL',
            sex: 'F',
            createdAt: new Date('2020-02-01'),
          });

          // when
          const result = await getCleaCertifiedCandidateCsv([CleaCertifiedCandidate]);

          // then
          const headers =
            '"SIREN de l\'organisme";"Siret de l\'établissement";"Statut à l\'inscription";"Niveau d\'instruction";"Origine de la démarche";"Financeur";"Civilité";"Nom de naissance";"Nom d\'usage";"Prénom";"Email";"Téléphone";"Adresse";"Complément d\'adresse";"Ville";"Code postal";"Date de naissance";"Né à l\'étranger";"Zone géographique de naissance";"Né en collectivité d\'outre-mer";"Ville de naissance";"Code postal de naissance";"Date de passage";"CCPI";"Statut";"Obtention après la première évaluation ?"\n';
          const CleaCertifiedCandidateData =
            ';;;;;;"MME";"Bern";;"Léane";"princesse-lele@gg.fr";;;;;;"2001-05-10";"OUI";"400";"NON";"STE MARIE";"99416";"01/02/2020";"CléA Numérique by Pix";"CERTIFIE";';

          const expectedResult = '\uFEFF' + headers + CleaCertifiedCandidateData;

          expect(result).to.equal(expectedResult);
        });
      });
    });
  });
});
