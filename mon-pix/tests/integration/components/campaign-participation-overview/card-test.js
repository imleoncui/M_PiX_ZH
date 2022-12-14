import { describe, it } from 'mocha';
import { expect } from 'chai';
import { find, render } from '@ember/test-helpers';
import { contains } from '../../../helpers/contains';
import hbs from 'htmlbars-inline-precompile';
import setupIntlRenderingTest from '../../../helpers/setup-intl-rendering';

describe('Integration | Component | CampaignParticipationOverview | Card', function() {
  setupIntlRenderingTest();
  let store;

  beforeEach(function() {
    store = this.owner.lookup('service:store');
  });

  it('should show campaign information', async function() {
    //given
    const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
      isShared: false,
      createdAt: '2020-12-10T15:16:20.109Z',
      assessmentState: 'started',
      campaignTitle: 'My campaign',
      organizationName: 'My organization',
    });
    this.set('campaignParticipationOverview', campaignParticipationOverview);

    //when
    await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

    //then
    expect(find('.campaign-participation-overview-card-header__title').textContent).to.equal('My organization');
    expect(find('.campaign-participation-overview-card-header__subtitle').textContent).to.equal('My campaign');
    expect(find('.campaign-participation-overview-card-header__date').getAttribute('datetime')).to.equal('2020-12-10T15:16:20.109Z');
  });

  describe('when card has "started" status', function() {
    it('should render card info', async function() {
      // given
      const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
        isShared: false,
        createdAt: '2020-12-10T15:16:20.109Z',
        assessmentState: 'started',
        campaignTitle: 'My campaign',
      });
      this.set('campaignParticipationOverview', campaignParticipationOverview);

      // when
      await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

      // then
      expect(find('.campaign-participation-overview-card-header__tag')).to.exist;
      expect(find('.campaign-participation-overview-card-header__tag').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.tag.started'));
      expect(find('.campaign-participation-overview-card-content__action').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.resume'));
      expect(find('.campaign-participation-overview-card-header__date').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.started-at', { date: '10/12/2020' }));
    });
  });

  describe('when card has "completed" status', function() {
    it('should render card info', async function() {
      // given
      const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
        isShared: false,
        createdAt: '2020-12-10T15:16:20.109Z',
        assessmentState: 'completed',
        campaignTitle: 'My campaign',
      });
      this.set('campaignParticipationOverview', campaignParticipationOverview);

      // when
      await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

      // then
      expect(find('.campaign-participation-overview-card-header__tag').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.tag.completed'));
      expect(find('.campaign-participation-overview-card-content__action').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.send'));
      expect(find('.campaign-participation-overview-card-header__date').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.started-at', { date: '10/12/2020' }));
    });
  });

  describe('when card has "finished" status', function() {
    it('should render card info', async function() {
      // given
      const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
        isShared: true,
        createdAt: '2020-12-10T15:16:20.109Z',
        sharedAt: '2020-12-18T15:16:20.109Z',
        assessmentState: 'completed',
        campaignTitle: 'My campaign',
      });
      this.set('campaignParticipationOverview', campaignParticipationOverview);

      // when
      await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

      // then
      expect(find('.campaign-participation-overview-card-header__tag').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.tag.finished'));
      expect(find('.campaign-participation-overview-card-content__action').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.see-more'));
      expect(find('.campaign-participation-overview-card-header__date').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.finished-at', { date: '18/12/2020' }));
    });

    it('should render the result with percentage', async function() {
      // given
      const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
        isShared: true,
        createdAt: '2020-12-10T15:16:20.109Z',
        sharedAt: '2020-12-18T15:16:20.109Z',
        assessmentState: 'completed',
        campaignTitle: 'My campaign',
        masteryPercentage: 20,
      });
      this.set('campaignParticipationOverview', campaignParticipationOverview);

      // when
      await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

      // then
      expect(contains('20??% de r??ussite'));
    });
  });

  describe('when card has "archived" status', function() {
    context('when the participation doesn\'t have a mastery percentage', ()=> {
      it('should render explanatory text', async function() {
        // given
        const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
          createdAt: '2020-01-01',
          campaignArchivedAt: '2020-01-03',
          assessmentState: 'completed',
          campaignTitle: 'My campaign',
          masteryPercentage: null,

        });
        this.set('campaignParticipationOverview', campaignParticipationOverview);

        // when
        await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

        // then
        expect(find('.campaign-participation-overview-card-header__tag').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.tag.archived'));
        expect(find('.campaign-participation-overview-card-header__date').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.started-at', { date: '01/01/2020' }));
        expect(contains('Parcours archiv?? par votre organisation. Vos r??sultats n\'ont pas pu ??tre envoy??s.'));
        expect(contains(this.intl.t('pages.campaign-participation-overview.card.see-more'))).to.not.exist;
      });
    });

    context('when the participation has a mastery percentage', ()=> {
      it('should render the result with percentage', async function() {
        // given
        const campaignParticipationOverview = store.createRecord('campaign-participation-overview', {
          createdAt: '2020-01-01',
          campaignArchivedAt: '2020-01-03',
          assessmentState: 'completed',
          campaignTitle: 'My campaign',
          masteryPercentage: 56,
        });
        this.set('campaignParticipationOverview', campaignParticipationOverview);

        // when
        await render(hbs`<CampaignParticipationOverview::Card @model={{this.campaignParticipationOverview}} />}`);

        // then
        expect(find('.campaign-participation-overview-card-header__tag').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.tag.archived'));
        expect(find('.campaign-participation-overview-card-header__date').textContent.trim()).to.equal(this.intl.t('pages.campaign-participation-overview.card.started-at', { date: '01/01/2020' }));
        expect(contains(this.intl.t('pages.campaign-participation-overview.card.see-more'))).to.not.exist;
        expect(contains('56??% de r??ussite'));
      });
    });
  });
});
