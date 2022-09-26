import { module, test } from 'qunit';
import setupIntlRenderingTest from '../../../helpers/setup-intl-rendering';
import { render } from '@1024pix/ember-testing-library';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | Ui::CertificabilityTooltip', function (hooks) {
  setupIntlRenderingTest(hooks);

  test('it should display the certificability tooltip', async function (assert) {
    // given
    this.label = 'Description';
    this.content = 'Amazing content';

    // when
    const screen = await render(hbs`<Ui::CertificabilityTooltip @aria-label={{label}} @content={{content}}/>`);
    const tooltip = screen.getByLabelText('Description');
    await focus(tooltip);
    // then
    assert.contains('Amazing content');
  });
});
