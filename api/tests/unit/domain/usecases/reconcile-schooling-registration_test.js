const { expect, sinon, domainBuilder, catchErr } = require('../../../test-helper');
const usecases = require('../../../../lib/domain/usecases');
const OrganizationLearner = require('../../../../lib/domain/models/OrganizationLearner');

const {
  CampaignCodeError,
  NotFoundError,
  SchoolingRegistrationAlreadyLinkedToUserError,
  UserShouldNotBeReconciledOnAnotherAccountError,
} = require('../../../../lib/domain/errors');

describe('Unit | UseCase | reconcile-schooling-registration', function () {
  let campaignCode;

  let campaignRepository;
  let schoolingRegistrationRepository;
  let userReconciliationService;

  let organizationLearner;
  let user;
  const organizationId = 1;
  const organizationLearnerId = 1;

  beforeEach(function () {
    campaignCode = 'ABCD12';
    organizationLearner = domainBuilder.buildOrganizationLearner({ organizationId, id: organizationLearnerId });
    user = {
      id: 1,
      firstName: 'Joe',
      lastName: 'Poe',
      birthdate: '02/02/1992',
    };

    campaignRepository = {
      getByCode: sinon.stub(),
    };
    schoolingRegistrationRepository = {
      reconcileUserToSchoolingRegistration: sinon.stub(),
      findOneByUserIdAndOrganizationId: sinon.stub(),
      findByUserId: sinon.stub(),
    };
    userReconciliationService = {
      findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser: sinon.stub(),
      checkIfStudentHasAnAlreadyReconciledAccount: sinon.stub(),
    };
  });

  context('When there is no campaign with the given code', function () {
    it('should throw a campaign code error', async function () {
      // given
      campaignRepository.getByCode.withArgs(campaignCode).resolves(null);

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
      });

      // then
      expect(result).to.be.instanceof(CampaignCodeError);
    });
  });

  context('When no schoolingRegistration found', function () {
    it('should throw a Not Found error', async function () {
      // given
      campaignRepository.getByCode
        .withArgs(campaignCode)
        .resolves(domainBuilder.buildCampaign({ organization: { id: organizationId } }));
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.throws(
        new NotFoundError('Error message')
      );

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
        userReconciliationService,
      });

      // then
      expect(result).to.be.instanceof(NotFoundError);
      expect(result.message).to.equal('Error message');
    });
  });

  context('When student has already a reconciled account', function () {
    it('should return a SchoolingRegistrationAlreadyLinkedToUser error', async function () {
      // given
      campaignRepository.getByCode
        .withArgs(campaignCode)
        .resolves(domainBuilder.buildCampaign({ organization: { id: organizationId } }));
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
        organizationLearner
      );
      userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.throws(
        new SchoolingRegistrationAlreadyLinkedToUserError()
      );

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
        userReconciliationService,
      });

      // then
      expect(result).to.be.instanceof(SchoolingRegistrationAlreadyLinkedToUserError);
    });
  });

  context('When another student is already reconciled in the same organization and with the same user', function () {
    it('should return a SchoolingRegistrationAlreadyLinkedToUser error', async function () {
      // given
      organizationLearner.userId = user.id;
      organizationLearner.firstName = user.firstName;
      organizationLearner.lastName = user.lastName;

      const alreadyReconciledOrganizationLearnerWithAnotherStudent = domainBuilder.buildOrganizationLearner({
        organizationId,
        userId: user.id,
      });

      const exceptedErrorMessage =
        'Un autre étudiant est déjà réconcilié dans la même organisation et avec le même compte utilisateur';
      campaignRepository.getByCode
        .withArgs(campaignCode)
        .resolves(domainBuilder.buildCampaign({ organization: { id: organizationId } }));
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
        organizationLearner
      );
      userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
      schoolingRegistrationRepository.findOneByUserIdAndOrganizationId
        .withArgs({
          userId: user.id,
          organizationId,
        })
        .resolves(alreadyReconciledOrganizationLearnerWithAnotherStudent);

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
        userReconciliationService,
        schoolingRegistrationRepository,
      });

      // then
      expect(result).to.be.instanceof(SchoolingRegistrationAlreadyLinkedToUserError);
      expect(result.message).to.equal(exceptedErrorMessage);
    });
  });

  context('When student is trying to be reconciled on an account', function () {
    context('And the national student ids are different', function () {
      context('And birthdays are identical', function () {
        it('should reconcile accounts', async function () {
          // given
          const currentOrganizationId = 5;
          const previousOrganizationId = 4;
          const reconciliationInfo = {
            id: 1,
            firstName: 'Guy',
            lastName: 'Tar',
            birthdate: '07/12/1996',
          };

          const campaign = domainBuilder.buildCampaign();
          const currentOrganizationLearner = domainBuilder.buildOrganizationLearner({
            id: 7,
            birthdate: '07/12/1996',
            nationalStudentId: 'currentINE',
            organizationId: currentOrganizationId,
          });
          const previousOrganizationLearner = domainBuilder.buildOrganizationLearner({
            id: 6,
            userId: reconciliationInfo.id,
            birthdate: '07/12/1996',
            nationalStudentId: 'oldINE',
            organizationId: previousOrganizationId,
          });

          campaignRepository.getByCode.resolves(campaign);
          userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
            currentOrganizationLearner
          );
          userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
          schoolingRegistrationRepository.findOneByUserIdAndOrganizationId.resolves();
          schoolingRegistrationRepository.findByUserId.withArgs({ userId: 1 }).resolves([previousOrganizationLearner]);
          schoolingRegistrationRepository.reconcileUserToSchoolingRegistration.resolves(currentOrganizationLearner);

          // when
          await usecases.reconcileSchoolingRegistration({
            reconciliationInfo,
            withReconciliation: true,
            campaignCode,
            campaignRepository,
            userReconciliationService,
            schoolingRegistrationRepository,
          });

          // then
          expect(
            schoolingRegistrationRepository.reconcileUserToSchoolingRegistration
          ).to.have.been.calledOnceWithExactly({
            userId: reconciliationInfo.id,
            schoolingRegistrationId: currentOrganizationLearner.id,
          });
        });
      });

      context('And birthdays are different', function () {
        it('should throw UserShouldNotBeReconciledOnAnotherAccountError error', async function () {
          // given
          const currentOrganizationId = 5;
          const previousOrganizationId = 4;
          const reconciliationInfo = {
            id: 1,
            firstName: 'Guy',
            lastName: 'Tar',
            birthdate: '07/12/1996',
          };

          const campaign = domainBuilder.buildCampaign();
          const currentOrganizationLearner = domainBuilder.buildOrganizationLearner({
            id: 7,
            birthdate: '08/10/1980',
            nationalStudentId: 'currentINE',
            organizationId: currentOrganizationId,
          });
          const previousOrganizationLearner = domainBuilder.buildOrganizationLearner({
            id: 6,
            userId: reconciliationInfo.id,
            birthdate: '07/12/1996',
            nationalStudentId: 'oldINE',
            organizationId: previousOrganizationId,
          });

          campaignRepository.getByCode.resolves(campaign);
          userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
            currentOrganizationLearner
          );
          userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
          schoolingRegistrationRepository.findOneByUserIdAndOrganizationId.resolves();
          schoolingRegistrationRepository.findByUserId.withArgs({ userId: 1 }).resolves([previousOrganizationLearner]);

          // when
          const error = await catchErr(usecases.reconcileSchoolingRegistration)({
            reconciliationInfo,
            withReconciliation: true,
            campaignCode,
            campaignRepository,
            userReconciliationService,
            schoolingRegistrationRepository,
          });

          // then
          expect(error).to.be.instanceOf(UserShouldNotBeReconciledOnAnotherAccountError);
        });
      });
    });

    context('And the national student ids are identical', function () {
      it('should reconcile accounts', async function () {
        // given
        const currentOrganizationId = 5;
        const previousOrganizationId = 4;
        const reconciliationInfo = {
          id: 1,
          firstName: 'Guy',
          lastName: 'Tar',
          birthdate: '07/12/1996',
        };

        const campaign = domainBuilder.buildCampaign();
        const currentOrganizationLearner = domainBuilder.buildOrganizationLearner({
          id: 7,
          birthdate: '07/12/1996',
          nationalStudentId: 'similarINE',
          organizationId: currentOrganizationId,
        });
        const previousOrganizationLearner = domainBuilder.buildOrganizationLearner({
          id: 6,
          userId: reconciliationInfo.id,
          birthdate: '07/12/1980',
          nationalStudentId: 'similarINE',
          organizationId: previousOrganizationId,
        });

        campaignRepository.getByCode.resolves(campaign);
        userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
          currentOrganizationLearner
        );
        userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
        schoolingRegistrationRepository.findOneByUserIdAndOrganizationId.resolves();
        schoolingRegistrationRepository.findByUserId.withArgs({ userId: 1 }).resolves([previousOrganizationLearner]);
        schoolingRegistrationRepository.reconcileUserToSchoolingRegistration.resolves(currentOrganizationLearner);

        // when
        await usecases.reconcileSchoolingRegistration({
          reconciliationInfo,
          withReconciliation: true,
          campaignCode,
          campaignRepository,
          userReconciliationService,
          schoolingRegistrationRepository,
        });

        // then
        expect(schoolingRegistrationRepository.reconcileUserToSchoolingRegistration).to.have.been.calledOnceWithExactly(
          {
            userId: reconciliationInfo.id,
            schoolingRegistrationId: currentOrganizationLearner.id,
          }
        );
      });
    });

    context("And the logged account's national student id is null and the birthdays are different", function () {
      it('should reconcile accounts', async function () {
        // given
        const currentOrganizationId = 5;
        const previousOrganizationId = 4;
        const reconciliationInfo = {
          id: 1,
          firstName: 'Guy',
          lastName: 'Tar',
          birthdate: '07/12/1996',
        };

        const campaign = domainBuilder.buildCampaign();
        const currentOrganizationLearner = domainBuilder.buildOrganizationLearner({
          id: 7,
          birthdate: '07/12/1996',
          nationalStudentId: 'INE',
          organizationId: currentOrganizationId,
        });
        const previousOrganizationLearner = domainBuilder.buildOrganizationLearner({
          id: 6,
          userId: reconciliationInfo.id,
          birthdate: '07/12/1994',
          nationalStudentId: null,
          organizationId: previousOrganizationId,
        });

        campaignRepository.getByCode.resolves(campaign);
        userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
          currentOrganizationLearner
        );
        userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
        schoolingRegistrationRepository.findOneByUserIdAndOrganizationId.resolves();
        schoolingRegistrationRepository.findByUserId.withArgs({ userId: 1 }).resolves([previousOrganizationLearner]);
        schoolingRegistrationRepository.reconcileUserToSchoolingRegistration.resolves(currentOrganizationLearner);

        // when
        await usecases.reconcileSchoolingRegistration({
          reconciliationInfo,
          withReconciliation: true,
          campaignCode,
          campaignRepository,
          userReconciliationService,
          schoolingRegistrationRepository,
        });

        // then
        expect(schoolingRegistrationRepository.reconcileUserToSchoolingRegistration).to.have.been.calledOnceWithExactly(
          {
            userId: reconciliationInfo.id,
            schoolingRegistrationId: currentOrganizationLearner.id,
          }
        );
      });
    });

    context(
      'And the logged account has multiple registrations with one null national student id and another with a different one',
      function () {
        context('And birthdays are different', function () {
          it('should throw UserShouldNotBeReconciledOnAnotherAccountError error', async function () {
            // given
            const currentOrganizationId = 5;
            const previousOrganizationId = 4;
            const reconciliationInfo = {
              id: 1,
              firstName: 'Guy',
              lastName: 'Tar',
              birthdate: '07/12/1996',
            };

            const campaign = domainBuilder.buildCampaign();
            const currentOrganizationLearner = domainBuilder.buildOrganizationLearner({
              id: 7,
              birthdate: '08/10/1980',
              nationalStudentId: 'currentINE',
              organizationId: currentOrganizationId,
            });
            const previousOrganizationLearner = domainBuilder.buildOrganizationLearner({
              id: 6,
              userId: reconciliationInfo.id,
              birthdate: '07/12/1996',
              nationalStudentId: null,
              organizationId: previousOrganizationId,
            });
            const otherOrganizationLearner = domainBuilder.buildOrganizationLearner({
              id: 9,
              userId: reconciliationInfo.id,
              birthdate: '07/12/1996',
              nationalStudentId: 'oldINE',
              organizationId: previousOrganizationId,
            });

            campaignRepository.getByCode.resolves(campaign);
            userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
              currentOrganizationLearner
            );
            userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
            schoolingRegistrationRepository.findOneByUserIdAndOrganizationId.resolves();
            schoolingRegistrationRepository.findByUserId
              .withArgs({ userId: 1 })
              .resolves([previousOrganizationLearner, otherOrganizationLearner]);

            // when
            const error = await catchErr(usecases.reconcileSchoolingRegistration)({
              reconciliationInfo,
              withReconciliation: true,
              campaignCode,
              campaignRepository,
              userReconciliationService,
              schoolingRegistrationRepository,
            });

            // then
            expect(error).to.be.instanceOf(UserShouldNotBeReconciledOnAnotherAccountError);
          });
        });

        context('And birthdays are identical', function () {
          it('should reconcile accounts', async function () {
            // given
            const currentOrganizationId = 5;
            const previousOrganizationId = 4;
            const reconciliationInfo = {
              id: 1,
              firstName: 'Guy',
              lastName: 'Tar',
              birthdate: '07/12/1996',
            };

            const campaign = domainBuilder.buildCampaign();
            const currentOrganizationLearner = domainBuilder.buildOrganizationLearner({
              id: 7,
              birthdate: '07/12/1996',
              nationalStudentId: 'currentINE',
              organizationId: currentOrganizationId,
            });
            const previousOrganizationLearner = domainBuilder.buildOrganizationLearner({
              id: 6,
              userId: reconciliationInfo.id,
              birthdate: '07/12/1996',
              nationalStudentId: null,
              organizationId: previousOrganizationId,
            });
            const otherOrganizationLearner = domainBuilder.buildOrganizationLearner({
              id: 9,
              userId: reconciliationInfo.id,
              birthdate: '07/12/1996',
              nationalStudentId: 'oldINE',
              organizationId: previousOrganizationId,
            });

            campaignRepository.getByCode.resolves(campaign);
            userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
              currentOrganizationLearner
            );
            userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
            schoolingRegistrationRepository.findOneByUserIdAndOrganizationId.resolves();
            schoolingRegistrationRepository.findByUserId
              .withArgs({ userId: 1 })
              .resolves([previousOrganizationLearner, otherOrganizationLearner]);

            // when
            await usecases.reconcileSchoolingRegistration({
              reconciliationInfo,
              withReconciliation: true,
              campaignCode,
              campaignRepository,
              userReconciliationService,
              schoolingRegistrationRepository,
            });

            // then
            expect(
              schoolingRegistrationRepository.reconcileUserToSchoolingRegistration
            ).to.have.been.calledOnceWithExactly({
              userId: reconciliationInfo.id,
              schoolingRegistrationId: currentOrganizationLearner.id,
            });
          });
        });
      }
    );
  });

  context('When one schoolingRegistration matched on names', function () {
    it('should associate user with schoolingRegistration', async function () {
      // given
      const withReconciliation = true;
      organizationLearner.userId = user.id;
      organizationLearner.firstName = user.firstName;
      organizationLearner.lastName = user.lastName;
      campaignRepository.getByCode
        .withArgs(campaignCode)
        .resolves(domainBuilder.buildCampaign({ organization: { id: organizationId } }));
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
        organizationLearner
      );
      userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();
      schoolingRegistrationRepository.reconcileUserToSchoolingRegistration
        .withArgs({
          userId: user.id,
          schoolingRegistrationId: organizationLearnerId,
        })
        .resolves(organizationLearner);
      schoolingRegistrationRepository.findByUserId.resolves([organizationLearner]);

      // when
      const result = await usecases.reconcileSchoolingRegistration({
        reconciliationInfo: user,
        withReconciliation,
        campaignCode,
        campaignRepository,
        userReconciliationService,
        schoolingRegistrationRepository,
      });

      // then
      expect(result).to.be.instanceOf(OrganizationLearner);
      expect(result.userId).to.be.equal(user.id);
    });
  });

  context('When withReconciliation is false', function () {
    it('should not associate user with schoolingRegistration', async function () {
      // given
      const withReconciliation = false;
      organizationLearner.userId = user.id;
      organizationLearner.firstName = user.firstName;
      organizationLearner.lastName = user.lastName;
      campaignRepository.getByCode
        .withArgs(campaignCode)
        .resolves(domainBuilder.buildCampaign({ organization: { id: organizationId } }));
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(
        organizationLearner
      );
      schoolingRegistrationRepository.findByUserId.resolves([organizationLearner]);
      userReconciliationService.checkIfStudentHasAnAlreadyReconciledAccount.resolves();

      // when
      const result = await usecases.reconcileSchoolingRegistration({
        reconciliationInfo: user,
        withReconciliation,
        campaignCode,
        campaignRepository,
        userReconciliationService,
        schoolingRegistrationRepository,
      });

      // then
      expect(result).to.be.undefined;
      expect(schoolingRegistrationRepository.reconcileUserToSchoolingRegistration).to.not.have.been.called;
    });
  });
});
