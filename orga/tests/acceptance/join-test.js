import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import fillInByLabel from '../helpers/extended-ember-test-helpers/fill-in-by-label';
import clickByLabel from '../helpers/extended-ember-test-helpers/click-by-label';
import { setupApplicationTest } from 'ember-qunit';

import { currentSession } from 'ember-simple-auth/test-support';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

import {
  createUserWithMembership,
  createUserWithMembershipAndTermsOfServiceAccepted,
  createPrescriberByUser,
} from '../helpers/test-init';

module('Acceptance | join', function(hooks) {

  setupApplicationTest(hooks);
  setupMirage(hooks);

  module('When prescriber tries to go on join page', function() {

    test('it should remain on join page when organization-invitation exists', async function(assert) {
      // given
      const code = 'ABCDEFGH01';
      const organizationId = server.create('organization', { name: 'College BRO & Evil Associates' }).id;
      const organizationInvitationId = server.create('organizationInvitation', {
        organizationId, email: 'random@email.com', status: 'pending', code,
      }).id;

      // when
      await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);

      // then
      assert.equal(currentURL(), `/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
      assert.notOk(currentSession(this.application).get('isAuthenticated'), 'The user is still unauthenticated');
    });

    test('it should redirect user to login page when organization-invitation does not exist', async function(assert) {
      // when
      await visit('rejoindre?invitationId=123456&code=FAKE999');

      // then
      assert.equal(currentURL(), '/connexion');
      assert.notOk(currentSession(this.application).get('isAuthenticated'), 'The user is still unauthenticated');
    });

    test('it should redirect user to login page when organization-invitation has already been accepted', async function(assert) {
      // given
      const code = 'ABCDEFGH01';
      const organizationId = server.create('organization', { name: 'College BRO & Evil Associates' }).id;
      const organizationInvitationId = server.create('organizationInvitation', {
        organizationId, email: 'random@email.com', status: 'accepted', code,
      }).id;

      // when
      await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);

      // then
      assert.equal(currentURL(), '/connexion?hasInvitationError=true');
      assert.notOk(currentSession(this.application).get('isAuthenticated'), 'The user is still unauthenticated');
      assert.dom('.login-form__invitation-error').exists();
      assert.dom('.login-form__invitation-error').hasText('Cette invitation a d??j?? ??t?? accept??e. Connectez-vous ou contactez l???administrateur de votre espace Pix Orga.');
    });
  });

  module('Login', function() {

    module('When prescriber is logging in but has not accepted terms of service yet', function(hooks) {

      let user;
      let organizationInvitationId;
      let code;

      hooks.beforeEach(() => {
        user = createUserWithMembership();
        createPrescriberByUser(user);

        code = 'ABCDEFGH01';
        organizationInvitationId = server.create('organizationInvitation', {
          organizationId: user.userOrgaSettings.organization.id,
          email: 'random@email.com',
          status: 'pending',
          code,
        }).id;
      });

      test('it should redirect user to the terms-of-service page', async function(assert) {
        // given
        await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        await clickByLabel('Se connecter');
        await fillInByLabel('Adresse e-mail', user.email);
        await fillInByLabel('Mot de passe', 'secret');

        // when
        await clickByLabel('Je me connecte');

        // then
        assert.equal(currentURL(), '/cgu');
        assert.ok(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');
      });

      test('it should not show menu nor top bar', async function(assert) {
        // given
        server.create('campaign');

        await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        await clickByLabel('Se connecter');
        await fillInByLabel('Adresse e-mail', user.email);
        await fillInByLabel('Mot de passe', 'secret');

        // when
        await clickByLabel('Je me connecte');

        // then
        assert.ok(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');

        assert.dom('.app__sidebar').doesNotExist();
        assert.dom('.main-content__topbar').doesNotExist();
      });
    });

    module('When prescriber is logging in and has accepted terms of service', function(hooks) {
      let user;
      let organizationInvitationId;
      let code;

      hooks.beforeEach(() => {
        user = createUserWithMembershipAndTermsOfServiceAccepted();
        createPrescriberByUser(user);

        code = 'ABCDEFGH01';
        organizationInvitationId = server.create('organizationInvitation', {
          organizationId: user.userOrgaSettings.organization.id,
          email: 'random@email.com',
          status: 'pending',
          code,
        }).id;
      });

      test('it should redirect user to the campaigns list', async function(assert) {
        // given
        server.create('campaign');

        await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        await clickByLabel('Se connecter');
        await fillInByLabel('Adresse e-mail', user.email);
        await fillInByLabel('Mot de passe', 'secret');

        // when
        await clickByLabel('Je me connecte');

        // then
        assert.equal(currentURL(), '/campagnes');
        assert.ok(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');
      });

      test('it should show prescriber name', async function(assert) {
        // given
        server.create('campaign');

        await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        await clickByLabel('Se connecter');
        await fillInByLabel('Adresse e-mail', user.email);
        await fillInByLabel('Mot de passe', 'secret');

        // when
        await clickByLabel('Je me connecte');

        // then
        assert.ok(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');

        assert.dom('.logged-user-summary__name').hasText('Harry Cover');
      });
    });

    module('When prescriber is logging in but his credentials are invalid', function(hooks) {

      let user;
      let organizationInvitationId;
      let code;

      hooks.beforeEach(() => {
        user = createUserWithMembership();
        code = 'ABCDEFGH01';
        const organizationId = server.create('organization', { name: 'College BRO & Evil Associates' }).id;
        organizationInvitationId = server.create('organizationInvitation', {
          organizationId, email: 'random@email.com', status: 'pending', code,
        }).id;
      });

      test('it should remain on join page', async function(assert) {
        // given
        server.post('/token', {
          errors: [{
            detail: 'L\'adresse e-mail et/ou le mot de passe saisis sont incorrects.',
            status: '4O1',
            title: 'Unauthorized',
          }],
        }, 401);

        await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        await clickByLabel('Se connecter');
        await fillInByLabel('Adresse e-mail', user.email);
        await fillInByLabel('Mot de passe', 'fakepassword');

        // when
        await clickByLabel('Je me connecte');

        // then
        assert.equal(currentURL(), `/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        assert.notOk(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');
        assert.dom('#login-form-error-message').hasText('L\'adresse e-mail et/ou le mot de passe saisis sont incorrects.');
      });
    });

    module('When prescriber has already accepted organization-invitation or prescriber is already a member of the organization', function(hooks) {

      let user;
      let organizationInvitationId;
      let code;

      hooks.beforeEach(() => {
        user = createUserWithMembership();
        createPrescriberByUser(user);

        code = 'ABCDEFGH01';
        const organizationId = server.create('organization', { name: 'College BRO & Evil Associates' }).id;
        organizationInvitationId = server.create('organizationInvitation', {
          organizationId, email: 'random@email.com', status: 'pending', code,
        }).id;
      });

      test('it should redirect to terms-of-service page', async function(assert) {
        // given
        server.post(`/organization-invitations/${organizationInvitationId}/response`, {
          errors: [{
            detail: '',
            status: '412',
            title: '',
          }],
        }, 412);
        await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
        await clickByLabel('Se connecter');
        await fillInByLabel('Adresse e-mail', user.email);
        await fillInByLabel('Mot de passe', 'secret');

        // when
        await clickByLabel('Je me connecte');

        // then
        assert.equal(currentURL(), '/cgu');
        assert.ok(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');
      });
    });
  });

  module('Register', function() {

    module('When prescriber is registering', function() {

      module('When a pending organization-invitation already exists', function(hooks) {

        let organizationId;

        hooks.beforeEach(() => {
          organizationId = server.create('organization', { name: 'College BRO & Evil Associates' }).id;
        });

        test('it should accept invitation and redirect prescriber to the terms-of-service page', async function(assert) {
          // given
          const code = 'ABCDEFGH01';
          const organizationInvitationId = server.create('organizationInvitation', {
            organizationId, email: 'random@email.com', status: 'pending', code,
          }).id;

          await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
          await fillInByLabel('Pr??nom', 'pix');
          await fillInByLabel('Nom', 'pix');
          await fillInByLabel('Adresse e-mail', 'shi@fu.me');
          await fillInByLabel('Mot de passe', 'Password4register');
          await clickByLabel('Accepter les conditions d\'utilisation de Pix');

          // when
          await clickByLabel('Je m\'inscris');

          // then
          assert.equal(currentURL(), '/cgu');
          assert.ok(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');
          const organizationInvitation = server.db.organizationInvitations[0];
          assert.equal(organizationInvitation.status, 'accepted');
        });
      });

      module('When prescriber already exist', function(hooks) {

        let organizationId;

        hooks.beforeEach(() => {
          organizationId = server.create('organization', { name: 'College BRO & Evil Associates' }).id;
        });

        test('should redirect prescriber to the campaigns list', async function(assert) {
          // given
          const code = 'ABCDEFGH01';
          const organizationInvitationId = server.create('organizationInvitation', {
            organizationId, email: 'random@email.com', status: 'pending', code,
          }).id;

          server.post('/users', {
            errors: [{
              detail: '',
              status: '422',
              title: '',
            }],
          }, 422);

          await visit(`/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
          await fillInByLabel('Pr??nom', 'pix');
          await fillInByLabel('Nom', 'pix');
          await fillInByLabel('Adresse e-mail', 'alreadyUser@organization.org');
          await fillInByLabel('Mot de passe', 'Password4register');
          await clickByLabel('Accepter les conditions d\'utilisation de Pix');

          // when
          await clickByLabel('Je m\'inscris');

          // then
          assert.equal(currentURL(), `/rejoindre?invitationId=${organizationInvitationId}&code=${code}`);
          assert.notOk(currentSession(this.application).get('isAuthenticated'), 'The user is authenticated');
        });
      });
    });
  });

});
