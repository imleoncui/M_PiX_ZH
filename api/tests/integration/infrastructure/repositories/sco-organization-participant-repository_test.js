const _ = require('lodash');
const { expect, databaseBuilder } = require('../../../test-helper');
const scoOrganizationParticipantRepository = require('../../../../lib/infrastructure/repositories/sco-organization-participant-repository');
const ScoOrganizationParticipant = require('../../../../lib/domain/read-models/ScoOrganizationParticipant');
const CampaignTypes = require('../../../../lib/domain/models/CampaignTypes');
const CampaignParticipationStatuses = require('../../../../lib/domain/models/CampaignParticipationStatuses');

describe('Integration | Infrastructure | Repository | sco-organization-participant-repository', function () {
  describe('#findPaginatedFilteredScoParticipants', function () {
    it('should return instances of ScoOrganizationParticipant', async function () {
      // given
      const organization = databaseBuilder.factory.buildOrganization();
      databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization.id,
        userId: null,
      });
      await databaseBuilder.commit();

      // when
      const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
        organizationId: organization.id,
      });

      // then
      expect(data[0]).to.be.an.instanceOf(ScoOrganizationParticipant);
    });

    it('should return all the ScoOrganizationParticipants for a given organization ID', async function () {
      // given
      const organization_1 = databaseBuilder.factory.buildOrganization();
      const organization_2 = databaseBuilder.factory.buildOrganization();

      const user = databaseBuilder.factory.buildUser();

      const firstOrganizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization_1.id,
      });
      const secondOrganizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization_1.id,
        userId: user.id,
      });
      databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization_2.id });

      await databaseBuilder.commit();

      // when
      const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
        organizationId: organization_1.id,
      });

      // then
      expect(_.map(data, 'id')).to.have.members([firstOrganizationLearner.id, secondOrganizationLearner.id]);
    });

    it('should return only once the same sco participant', async function () {
      // given
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      const campaignId = databaseBuilder.factory.buildCampaign({ organizationId, name: 'some campaign' }).id;
      const otherCampaignId = databaseBuilder.factory.buildCampaign({ organizationId, name: 'other campaign' }).id;
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

      databaseBuilder.factory.buildCampaignParticipation({ campaignId, organizationLearnerId });
      databaseBuilder.factory.buildCampaignParticipation({ campaignId: otherCampaignId, organizationLearnerId });
      await databaseBuilder.commit();

      // when
      const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
        organizationId,
      });

      // then

      expect(data).to.have.lengthOf(1);
    });

    it('should return the sco participants not disabled', async function () {
      // given
      const organization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        isDisabled: false,
        organizationId: organization.id,
      });
      databaseBuilder.factory.buildOrganizationLearner({ isDisabled: true, organizationId: organization.id });
      await databaseBuilder.commit();

      // when
      const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
        organizationId: organization.id,
      });

      // then
      expect(data).to.have.lengthOf(1);
      expect(data[0].id).to.equal(organizationLearner.id);
    });

    it('should order organizationLearners by lastName and then by firstName with no sensitive case', async function () {
      // given
      const organization = databaseBuilder.factory.buildOrganization();

      const firstOrganizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization.id,
        lastName: 'Grenier',
      });
      const secondOrganizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization.id,
        lastName: 'Avatar',
        firstName: 'Xavier',
      });
      const thirdOrganizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization.id,
        lastName: 'Avatar',
        firstName: 'Arthur',
      });
      const fourthOrganizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: organization.id,
        lastName: 'Avatar',
        firstName: 'MATHURIN',
      });

      await databaseBuilder.commit();

      // when
      const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
        organizationId: organization.id,
      });

      // then
      expect(_.map(data, 'id')).to.deep.include.ordered.members([
        thirdOrganizationLearner.id,
        fourthOrganizationLearner.id,
        secondOrganizationLearner.id,
        firstOrganizationLearner.id,
      ]);
    });

    describe('When organizationLearner is filtered', function () {
      it('should return sco participants filtered by lastname', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();

        databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id, lastName: 'Grenier' });
        databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id, lastName: 'Avatar' });
        databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id, lastName: 'UvAtur' });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
          filter: { lastName: 'Vat' },
        });

        // then
        expect(_.map(data, 'lastName')).to.deep.equal(['Avatar', 'UvAtur']);
      });

      it('should return sco participants filtered by firstname', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();

        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Foo',
          lastName: '1',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Bar',
          lastName: '2',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Baz',
          lastName: '3',
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
          filter: { firstName: 'ba' },
        });

        // then
        expect(_.map(data, 'firstName')).to.deep.equal(['Bar', 'Baz']);
      });

      it('should return sco participants filtered by division', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();

        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          lastName: '1',
          division: '4A',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          lastName: '2',
          division: '3B',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          lastName: '3',
          division: '3A',
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
          filter: { divisions: ['3A', '3B'] },
        });

        // then
        expect(_.map(data, 'division')).to.deep.equal(['3B', '3A']);
      });

      it('should return sco participants filtered by firstname AND lastname', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();

        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'John',
          lastName: 'Rambo',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Jane',
          lastName: 'Rambo',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Chuck',
          lastName: 'Norris',
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
          filter: { firstName: 'ja', lastName: 'ram' },
        });

        // then
        expect(_.map(data, 'firstName')).to.deep.equal(['Jane']);
      });

      describe('When organizationLearner is filtered by user connexion type', function () {
        let organizationId;

        beforeEach(async function () {
          // given
          organizationId = databaseBuilder.factory.buildOrganization().id;

          databaseBuilder.factory.buildOrganizationLearnerWithUser({
            organizationId,
            lastName: 'Rambo',
            user: { email: 'john@rambo.com', username: null },
          });
          databaseBuilder.factory.buildOrganizationLearnerWithUser({
            organizationId,
            lastName: 'Willis',
            user: { email: null, username: 'willy' },
          });
          const organizationLearnerOfUserWithSamlId = databaseBuilder.factory.buildOrganizationLearnerWithUser({
            organizationId,
            lastName: 'Norris',
            user: { email: null, username: null },
          });
          databaseBuilder.factory.buildAuthenticationMethod.withGarAsIdentityProvider({
            externalIdentifier: 'chucky',
            userId: organizationLearnerOfUserWithSamlId.userId,
          });
          databaseBuilder.factory.buildOrganizationLearnerWithUser({
            organizationId,
            lastName: 'Lee',
            user: { email: null, username: null },
          });
          await databaseBuilder.commit();
        });

        it('should return sco participants filtered by "none" user connexion', async function () {
          // when
          const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
            organizationId,
            filter: { connexionType: 'none' },
          });

          // then
          expect(_.map(data, 'lastName')).to.deep.equal(['Lee']);
        });

        it('should return sco participants filtered by "identifiant" user connexion', async function () {
          // when
          const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
            organizationId,
            filter: { connexionType: 'identifiant' },
          });

          // then
          expect(_.map(data, 'lastName')).to.deep.equal(['Willis']);
        });

        it('should return sco participants filtered by "email" user connexion', async function () {
          // when
          const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
            organizationId,
            filter: { connexionType: 'email' },
          });

          // then
          expect(_.map(data, 'lastName')).to.deep.equal(['Rambo']);
        });

        it('should return sco participants filtered by "mediacentre" user connexion', async function () {
          // when
          const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
            organizationId,
            filter: { connexionType: 'mediacentre' },
          });

          // then
          expect(_.map(data, 'lastName')).to.deep.equal(['Norris']);
        });
      });

      it('should return sco participants paginated', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();

        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Foo',
          lastName: '1',
        });
        databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          firstName: 'Bar',
          lastName: '2',
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
          page: { number: 2, size: 1 },
        });

        // then
        expect(_.map(data, 'firstName')).to.deep.equal(['Bar']);
      });
    });

    describe('When sco participant is reconciled and authenticated by email (and/or) username', function () {
      it('should return all sco participant properties including the reconciled user:email,username', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();
        const user = databaseBuilder.factory.buildUser();
        const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          userId: user.id,
        });
        const expectedScoOrganizationParticipant = new ScoOrganizationParticipant({
          id: organizationLearner.id,
          firstName: organizationLearner.firstName,
          lastName: organizationLearner.lastName,
          birthdate: organizationLearner.birthdate,
          username: user.username,
          userId: organizationLearner.userId,
          email: user.email,
          isAuthenticatedFromGAR: false,
          division: organizationLearner.division,
          participationCount: 0,
          lastParticipationDate: null,
          campaignName: null,
          campaignType: null,
          participationStatus: null,
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
        });

        // then
        expect(data[0]).to.deep.equal(expectedScoOrganizationParticipant);
      });
    });

    describe('When sco participant is reconciled and authenticated from GAR', function () {
      it('should return isAuthenticatedFromGAR property equal to true', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();
        const user = databaseBuilder.factory.buildUser({
          username: null,
          email: null,
        });
        databaseBuilder.factory.buildAuthenticationMethod.withGarAsIdentityProvider({
          externalIdentifier: 'samlId',
          userId: user.id,
        });
        const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          userId: user.id,
        });
        const expectedScoOrganizationParticipant = new ScoOrganizationParticipant({
          id: organizationLearner.id,
          firstName: organizationLearner.firstName,
          lastName: organizationLearner.lastName,
          birthdate: organizationLearner.birthdate,
          username: null,
          email: null,
          userId: organizationLearner.userId,
          isAuthenticatedFromGAR: true,
          division: organizationLearner.division,
          participationCount: 0,
          lastParticipationDate: null,
          campaignName: null,
          campaignType: null,
          participationStatus: null,
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
        });

        // then
        expect(data[0]).to.deep.equal(expectedScoOrganizationParticipant);
      });
    });

    describe('When sco participant is not reconciled', function () {
      it('should return empty email, username, userId', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization();
        const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
          organizationId: organization.id,
          userId: null,
        });

        const expectedScoOrganizationParticipant = new ScoOrganizationParticipant({
          id: organizationLearner.id,
          firstName: organizationLearner.firstName,
          lastName: organizationLearner.lastName,
          birthdate: organizationLearner.birthdate,
          username: null,
          email: null,
          userId: organizationLearner.userId,
          isAuthenticatedFromGAR: false,
          division: organizationLearner.division,
          participationCount: 0,
          lastParticipationDate: null,
          campaignName: null,
          campaignType: null,
          participationStatus: null,
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId: organization.id,
        });

        // then
        expect(data[0]).to.deep.equal(expectedScoOrganizationParticipant);
      });
    });

    context('campaign information', function () {
      it('should return campaign name and type when there is at least a participation', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({
          organizationId,
          name: 'some campaign name',
          type: CampaignTypes.PROFILES_COLLECTION,
        }).id;
        const userId = databaseBuilder.factory.buildUser().id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId, userId }).id;
        databaseBuilder.factory.buildCampaignParticipation({ campaignId, organizationLearnerId });
        await databaseBuilder.commit();

        const expectedAttributes = {
          campaignName: 'some campaign name',
          campaignType: CampaignTypes.PROFILES_COLLECTION,
        };

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        expect(data[0].campaignName).to.deep.equal(expectedAttributes.campaignName);
        expect(data[0].campaignType).to.deep.equal(expectedAttributes.campaignType);
      });

      it('should return null when there is no participation', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const userId = databaseBuilder.factory.buildUser().id;
        databaseBuilder.factory.buildOrganizationLearner({ organizationId, userId });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        expect(data[0].campaignName).to.deep.equal(null);
        expect(data[0].campaignType).to.deep.equal(null);
      });

      it('should return campaign name and type only for a campaign in the given organization', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({
          name: 'some campaign name',
        }).id;
        const userId = databaseBuilder.factory.buildUser().id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId, userId }).id;
        databaseBuilder.factory.buildCampaignParticipation({ campaignId, organizationLearnerId });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        expect(data[0].campaignName).to.equal(null);
      });
    });

    context('#participationStatus', function () {
      it('should return participation status when there is at least a participation', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({
          organizationId,
          name: 'some campaign name',
          type: CampaignTypes.PROFILES_COLLECTION,
        }).id;
        const userId = databaseBuilder.factory.buildUser().id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId, userId }).id;
        databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          organizationLearnerId,
          status: CampaignParticipationStatuses.TO_SHARE,
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        expect(data[0].participationStatus).to.deep.equal(CampaignParticipationStatuses.TO_SHARE);
      });

      it('should return null when there is no participation', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const userId = databaseBuilder.factory.buildUser().id;
        databaseBuilder.factory.buildOrganizationLearner({ organizationId, userId });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        expect(data[0].participationStatus).to.deep.equal(null);
      });
    });

    context('#participationCount', function () {
      it('should count participations in several campaigns', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const otherCampaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

        databaseBuilder.factory.buildCampaignParticipation({ campaignId, organizationLearnerId });
        databaseBuilder.factory.buildCampaignParticipation({ campaignId: otherCampaignId, organizationLearnerId });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const participationCountAsArray = data.map((result) => result.participationCount);
        expect(participationCountAsArray).to.deep.equal([2]);
      });

      it('should count only participations not deleted', async function () {
        // given
        const deletedBy = databaseBuilder.factory.buildUser().id;
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const otherCampaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

        databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          organizationLearnerId,
          deletedAt: null,
          deletedBy: null,
        });
        databaseBuilder.factory.buildCampaignParticipation({
          campaignId: otherCampaignId,
          organizationLearnerId,
          deletedAt: new Date(),
          deletedBy,
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const participationCountAsArray = data.map((result) => result.participationCount);
        expect(participationCountAsArray).to.deep.equal([1]);
      });

      it('should count only participations not improved', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

        databaseBuilder.factory.buildCampaignParticipation({ campaignId, organizationLearnerId, isImproved: true });
        databaseBuilder.factory.buildCampaignParticipation({ campaignId, organizationLearnerId, isImproved: false });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const participationCountAsArray = data.map((result) => result.participationCount);
        expect(participationCountAsArray).to.deep.equal([1]);
      });

      it('should count 0 participation when sco participant has no participation', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        databaseBuilder.factory.buildOrganizationLearner({ organizationId });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const participationCountAsArray = data.map((result) => result.participationCount);
        expect(participationCountAsArray).to.deep.equal([0]);
      });
    });

    context('#lastParticipationDate', function () {
      it('should take the last participation date', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const otherCampaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

        const campaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          organizationLearnerId,
          createdAt: new Date('2022-01-01'),
        });
        databaseBuilder.factory.buildCampaignParticipation({
          campaignId: otherCampaignId,
          organizationLearnerId,
          createdAt: new Date('2021-01-01'),
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const lastParticipationDatesAsArray = data.map((result) => result.lastParticipationDate);
        expect(lastParticipationDatesAsArray).to.deep.equal([campaignParticipation.createdAt]);
      });

      it('should take the last participation date not deleted', async function () {
        // given
        const deletedBy = databaseBuilder.factory.buildUser().id;
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const otherCampaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

        const campaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          organizationLearnerId,
          deletedAt: null,
          deletedBy: null,
          createdAt: new Date('2021-02-01'),
        });
        databaseBuilder.factory.buildCampaignParticipation({
          campaignId: otherCampaignId,
          organizationLearnerId,
          deletedAt: new Date(),
          deletedBy,
          createdAt: new Date('2022-01-01'),
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const lastParticipationDatesAsArray = data.map((result) => result.lastParticipationDate);
        expect(lastParticipationDatesAsArray).to.deep.equal([campaignParticipation.createdAt]);
      });

      it('should take the last participation date not improved', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ organizationId }).id;
        const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner({ organizationId }).id;

        databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          organizationLearnerId,
          isImproved: true,
          createdAt: new Date('2022-01-01'),
        });
        const campaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          organizationLearnerId,
          isImproved: false,
          createdAt: new Date('2021-01-01'),
        });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const lastParticipationDatesAsArray = data.map((result) => result.lastParticipationDate);
        expect(lastParticipationDatesAsArray).to.deep.equal([campaignParticipation.createdAt]);
      });

      it('should be null when sco participant has no participation', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        databaseBuilder.factory.buildOrganizationLearner({ organizationId });
        await databaseBuilder.commit();

        // when
        const { data } = await scoOrganizationParticipantRepository.findPaginatedFilteredScoParticipants({
          organizationId,
        });

        // then
        const lastParticipationDatesAsArray = data.map((result) => result.lastParticipationDate);
        expect(lastParticipationDatesAsArray).to.deep.equal([null]);
      });
    });
  });
});