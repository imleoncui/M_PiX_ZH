const _ = require('lodash');
const BookshelfCampaign = require('../orm-models/Campaign');
const { NotFoundError } = require('../../domain/errors');
const bookshelfToDomainConverter = require('../utils/bookshelf-to-domain-converter');
const { knex } = require('../../../db/knex-database-connection');
const Campaign = require('../../domain/models/Campaign');
const skillRepository = require('./skill-repository');

const CAMPAIGNS_TABLE = 'campaigns';

module.exports = {
  isCodeAvailable(code) {
    return BookshelfCampaign.where({ code })
      .fetch({ require: false })
      .then((campaign) => {
        if (campaign) {
          return false;
        }
        return true;
      });
  },

  async getByCode(code) {
    const bookshelfCampaign = await BookshelfCampaign.where({ code }).fetch({
      require: false,
      withRelated: ['organization'],
    });
    return bookshelfToDomainConverter.buildDomainObject(BookshelfCampaign, bookshelfCampaign);
  },

  async get(id) {
    const bookshelfCampaign = await BookshelfCampaign.where({ id })
      .fetch({
        withRelated: ['creator', 'organization', 'targetProfile'],
      })
      .catch((err) => {
        if (err instanceof BookshelfCampaign.NotFoundError) {
          throw new NotFoundError(`Not found campaign for ID ${id}`);
        }
        throw err;
      });
    return bookshelfToDomainConverter.buildDomainObject(BookshelfCampaign, bookshelfCampaign);
  },

  async save(campaign) {
    const trx = await knex.transaction();
    const campaignAttributes = _.pick(campaign, [
      'name',
      'code',
      'title',
      'type',
      'idPixLabel',
      'customLandingPageText',
      'creatorId',
      'ownerId',
      'organizationId',
      'targetProfileId',
      'multipleSendings',
    ]);
    try {
      const [createdCampaignDTO] = await trx(CAMPAIGNS_TABLE).insert(campaignAttributes).returning('*');
      const createdCampaign = new Campaign(createdCampaignDTO);
      if (createdCampaign.isAssessment()) {
        const cappedTubes = await trx('target-profile_tubes')
          .select('tubeId', 'level')
          .where('targetProfileId', campaignAttributes.targetProfileId);
        const skillIds = [];
        for (const cappedTube of cappedTubes) {
          const allLevelSkills = await skillRepository.findActiveByTubeId(cappedTube.tubeId);
          const rightLevelSkills = allLevelSkills.filter((skill) => skill.difficulty <= cappedTube.level);
          skillIds.push(...rightLevelSkills.map((skill) => skill.id));
        }
        const skillData = skillIds.map((skillId) => ({ skillId, campaignId: createdCampaign.id }));
        await trx.batchInsert('campaign_skills', skillData);
      }
      await trx.commit();
      return createdCampaign;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  },

  async update(campaign) {
    const editedAttributes = _.pick(campaign, [
      'name',
      'title',
      'customLandingPageText',
      'archivedAt',
      'archivedBy',
      'ownerId',
    ]);

    const [editedCampaign] = await knex('campaigns').update(editedAttributes).where({ id: campaign.id }).returning('*');

    return new Campaign(editedCampaign);
  },

  async checkIfUserOrganizationHasAccessToCampaign(campaignId, userId) {
    try {
      await BookshelfCampaign.query((qb) => {
        qb.where({ 'campaigns.id': campaignId, 'memberships.userId': userId, 'memberships.disabledAt': null });
        qb.innerJoin('memberships', 'memberships.organizationId', 'campaigns.organizationId');
        qb.innerJoin('organizations', 'organizations.id', 'campaigns.organizationId');
      }).fetch();
    } catch (e) {
      return false;
    }
    return true;
  },

  async checkIfCampaignIsArchived(campaignId) {
    const bookshelfCampaign = await BookshelfCampaign.where({ id: campaignId }).fetch();

    const campaign = bookshelfToDomainConverter.buildDomainObject(BookshelfCampaign, bookshelfCampaign);
    return campaign.isArchived();
  },

  async getCampaignTitleByCampaignParticipationId(campaignParticipationId) {
    const campaign = await knex('campaigns')
      .select('title')
      .join('campaign-participations', 'campaign-participations.campaignId', 'campaigns.id')
      .where({ 'campaign-participations.id': campaignParticipationId })
      .first();

    if (!campaign) return null;
    return campaign.title;
  },

  async getCampaignCodeByCampaignParticipationId(campaignParticipationId) {
    const campaign = await knex('campaigns')
      .select('code')
      .join('campaign-participations', 'campaign-participations.campaignId', 'campaigns.id')
      .where({ 'campaign-participations.id': campaignParticipationId })
      .first();

    if (!campaign) return null;
    return campaign.code;
  },

  async getCampaignIdByCampaignParticipationId(campaignParticipationId) {
    const campaign = await knex('campaigns')
      .select('campaigns.id')
      .join('campaign-participations', 'campaign-participations.campaignId', 'campaigns.id')
      .where({ 'campaign-participations.id': campaignParticipationId })
      .first();

    if (!campaign) return null;
    return campaign.id;
  },
};
