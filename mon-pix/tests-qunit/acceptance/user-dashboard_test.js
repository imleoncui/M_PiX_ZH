import { currentURL, click, find, visit } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { invalidateSession } from '../helpers/invalidate-session';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { authenticateByEmail } from '../helpers/authentication';
import { contains } from '../helpers/contains';
import setupIntl from '../helpers/setup-intl';
import { clickByLabel } from '../helpers/click-by-label';

const ASSESSMENT = 'ASSESSMENT';

module('Acceptance | User dashboard page', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupIntl(hooks);

  let user;

  module('Visit the user dashboard page', function () {
    hooks.beforeEach(async function () {
      user = server.create('user', 'withEmail');
    });

    test('is not possible when user is not connected', async function (assert) {
      // when
      await visit('/accueil');

      // then
      assert.equal(currentURL(), '/connexion');
    });

    test('is possible when user is connected', async function (assert) {
      // given
      await authenticateByEmail(user);

      // when
      await visit('/accueil');

      // then
      assert.equal(currentURL(), '/accueil');
    });
  });

  module('campaign-participation-overviews', function () {
    hooks.beforeEach(async function () {
      user = server.create('user', 'withEmail');
    });

    module('when user is on campaign start page', function () {
      test('it should change menu on click on disconnect link', async function (assert) {
        // given
        await authenticateByEmail(user);
        await visit('/campagnes');

        // when
        await clickByLabel(this.intl.t('pages.fill-in-campaign-code.warning-message-logout'));

        // then
        assert.equal(contains(user.firstName), null);
        assert.dom(contains(this.intl.t('navigation.not-logged.sign-in'))).exists();
      });
    });

    module('when user is doing a campaign of type assessment', function () {
      module('when user has not completed the campaign', function (hooks) {
        hooks.beforeEach(async function () {
          const uncompletedCampaign = server.create(
            'campaign',
            {
              idPixLabel: 'email',
              type: ASSESSMENT,
              isArchived: false,
              title: 'My Campaign',
              code: '123',
            },
            'withThreeChallenges'
          );

          server.create('campaign-participation-overview', {
            assessmentState: 'started',
            campaignCode: uncompletedCampaign.code,
            campaignTitle: uncompletedCampaign.title,
            createdAt: new Date('2020-04-20T04:05:06Z'),
            isShared: false,
          });
          await authenticateByEmail(user);
        });

        hooks.afterEach(async function () {
          await invalidateSession();
        });

        test('should display a card with a resume button', async function (assert) {
          // when
          await visit('/accueil');
          // then
          const resumeButton = find('.campaign-participation-overview-card-content__action');
          assert.dom(resumeButton).exists();
          assert.equal(resumeButton.textContent.trim(), 'Reprendre');
        });
      });

      module('when user has completed the campaign but not shared his/her results', function (hooks) {
        hooks.beforeEach(async function () {
          const unsharedCampaign = server.create(
            'campaign',
            {
              idPixLabel: 'email',
              type: ASSESSMENT,
              isArchived: false,
              code: '123',
            },
            'withThreeChallenges'
          );

          server.create('campaign-participation-overview', {
            status: 'TO_SHARE',
            campaignCode: unsharedCampaign.code,
            createdAt: new Date('2020-04-20T04:05:06Z'),
            isShared: false,
          });
          await authenticateByEmail(user);
        });

        hooks.afterEach(async function () {
          await invalidateSession();
        });

        test('should display a card with a share button', async function (assert) {
          // when
          await visit('/accueil');

          // then
          const shareButton = find('.campaign-participation-overview-card-content__action');
          assert.dom(shareButton).exists();
          assert.equal(shareButton.textContent.trim(), 'Envoyer mes résultats');
        });
      });
    });
  });

  module('recommended-competences', function (hooks) {
    hooks.beforeEach(async function () {
      user = server.create('user', 'withEmail');
      await authenticateByEmail(user);
      await visit('/accueil');
    });

    test('should display recommended-competences section', function (assert) {
      assert.dom(find('section[data-test-recommended-competences]')).exists();
    });

    test('should display the link to profile', function (assert) {
      assert.dom(contains(this.intl.t('pages.dashboard.recommended-competences.profile-link'))).exists();
    });
  });

  module('retryable-competences', function (hooks) {
    hooks.beforeEach(async function () {
      user = server.create('user', 'withEmail');
      await authenticateByEmail(user);
      await visit('/accueil');
    });

    test('should display the improvable-competences section', function (assert) {
      assert.dom(contains(this.intl.t('pages.dashboard.improvable-competences.subtitle'))).exists();
    });
  });

  module('started-competences', function () {
    hooks.beforeEach(async function () {
      user = server.create('user', 'withEmail');
      await authenticateByEmail(user);
      await visit('/accueil');
    });

    test('should display started-competences section', function (assert) {
      assert.dom(find('section[data-test-started-competences]')).exists();
    });

    test('should link to competence-details page on click on level circle', async function (assert) {
      // when
      await click('.competence-card__link');

      // then
      const scorecard = user.scorecards.models[0];
      assert.equal(currentURL(), `/competences/${scorecard.competenceId}/details`);
    });
  });

  module('new-information', function (hooks) {
    hooks.afterEach(async function () {
      await invalidateSession();
    });

    module('when user has new information to see', function () {
      hooks.beforeEach(async function () {
        user = server.create('user', 'withEmail');
      });

      module('when user has closable information', function () {
        test('should close new dashboard information on user click', async function (assert) {
          // given
          await authenticateByEmail(user);
          await visit('/accueil');
          assert.dom(find('.new-information')).exists();

          // when
          await click('.new-information__close');

          // then
          assert.dom(find('.new-information')).doesNotExist();
        });
      });

      module('when user is doing a campaign of type collect profile', function () {
        let campaign, campaignParticipation;

        hooks.beforeEach(async function () {
          campaign = server.create('campaign', {
            isArchived: false,
            title: 'SomeTitle',
            type: 'PROFILES_COLLECTION',
            code: 'SNAP1234',
          });

          campaignParticipation = server.create('campaign-participation', {
            campaign,
            user,
            isShared: false,
            createdAt: new Date('2020-04-20T04:05:06Z'),
          });
          campaignParticipation.assessment.update({ state: 'completed' });
          user.update({ codeForLastProfileToShare: campaign.code });

          await authenticateByEmail(user);
        });

        module('when user has not shared his results', function () {
          test('should display a resume campaign banner for the campaign', async function (assert) {
            // when
            await visit('/accueil');

            // then
            assert.dom(find('.new-information__content')).exists();
            assert.dom(find('.new-information-content-text__button')).exists();
          });

          test('should display accessibility information in the banner', async function (assert) {
            // when
            await visit('/accueil');

            // then
            const button = find('.new-information-content-text__button');
            const a11yText = button.firstChild.textContent;
            assert.dom(button).exists();
            assert.dom(a11yText).exists();
          });
        });

        module('when users wants to share his results by clicking the resume button', function () {
          test('should redirect the user to the campaign results sharing page', async function (assert) {
            // given
            await visit('/accueil');

            // when
            await click('.new-information-content-text__button');

            // then
            assert.equal(currentURL(), '/campagnes/SNAP1234/collecte/envoi-profil');
          });
        });
      });
    });

    module('when user has no new information to see', function () {
      test('should not render any new-information banner', async function (assert) {
        // given
        user = server.create('user', 'withEmail', 'hasSeenNewDashboardInfo');

        // when
        await authenticateByEmail(user);

        // then
        assert.dom(find('.new-information__content')).doesNotExist();
      });
    });
  });
});
