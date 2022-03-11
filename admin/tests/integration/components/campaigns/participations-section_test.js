import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

module('Integration | Component | Campaigns | participations-section', function (hooks) {
  setupRenderingTest(hooks);

  test('it should display a list of participations', async function (assert) {
    // given
    const participation1 = EmberObject.create({
      firstName: 'Jean',
      lastName: 'Claude',
    });
    const participation2 = EmberObject.create({
      firstName: 'Jean',
      lastName: 'Pierre',
    });
    const participations = [participation1, participation2];
    this.set('participations', participations);
    participations.meta = { rowCount: 2 };

    // when
    await render(hbs`<Campaigns::ParticipationsSection @participations={{participations}}/>`);

    // then
    assert.dom('[aria-label="participation"]').exists({ count: 2 });
  });

  test('it should display participantExternalId column if idPixLabel is set', async function (assert) {
    // given
    const participation = EmberObject.create({
      participantExternalId: '123',
    });
    const participations = [participation];
    this.set('participations', participations);
    this.set('idPixLabel', 'identifiant');
    participations.meta = { rowCount: 2 };

    // when
    await render(
      hbs`<Campaigns::ParticipationsSection @participations={{participations}} @idPixLabel={{idPixLabel}}/>`
    );

    // then
    assert.contains('identifiant');
  });

  test('it should an empty table when no participations', async function (assert) {
    // given
    const participations = [];
    this.set('participations', participations);
    participations.meta = { rowCount: 2 };

    // when
    await render(hbs`<Campaigns::ParticipationsSection @participations={{participations}}/>`);

    // then
    assert.contains('Aucune participation');
  });
});