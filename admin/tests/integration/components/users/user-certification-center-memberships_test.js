import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@1024pix/ember-testing-library';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

module('Integration | Component | users | certification-center-memberships', function (hooks) {
  setupRenderingTest(hooks);

  module('When user isn’t member of any certification center', function () {
    test('it should display an empty table', async function (assert) {
      // given
      const certificationCenterMemberships = [];
      this.set('certificationCenterMemberships', certificationCenterMemberships);

      // when
      const screen = await render(
        hbs`<Users::UserCertificationCenterMemberships @certificationCenterMemberships={{certificationCenterMemberships}} />`
      );

      // then
      assert.dom(screen.getByText('Aucun centre de certification')).exists();
    });
  });

  module('When user is member of some certification centers', function () {
    test('it should display a table with the organizations the user is member of', async function (assert) {
      // given
      const certificationCenterMembership1 = EmberObject.create({
        certificationCenterId: 1,
        certificationCenterName: 'Centre Kaede',
        certificationCenterType: 'SCO',
        certificationCenterExternalId: '1234',
      });

      const certificationCenterMembership2 = EmberObject.create({
        certificationCenterId: 2,
        certificationCenterName: 'Centre Shigeru',
        certificationCenterType: 'PRO',
        certificationCenterExternalId: '12343',
      });

      const certificationCenterMemberships = [certificationCenterMembership1, certificationCenterMembership2];
      this.set('certificationCenterMemberships', certificationCenterMemberships);

      // when
      const screen = await render(
        hbs`<Users::UserCertificationCenterMemberships @certificationCenterMemberships={{certificationCenterMemberships}} />`
      );

      // then
      assert.dom(screen.getByText('Centre Kaede')).exists();
      assert.dom(screen.getByText('Centre Shigeru')).exists();
    });
  });
});
