import { describe, it } from 'mocha';
import { expect } from 'chai';
import { find, findAll, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import setupIntlRenderingTest from '../../../helpers/setup-intl-rendering';

describe('Integration | Component | Tutorials | Content', function () {
  setupIntlRenderingTest();

  it('renders the header', async function () {
    // when
    await render(hbs`<Tutorials::Content />`);

    // then
    expect(find('.user-tutorials-banner-v2__title')).to.exist;
    expect(find('.user-tutorials-banner-v2__description')).to.exist;
    expect(find('.user-tutorials-banner-v2__filters')).to.exist;
    expect(findAll('.user-tutorials-banner-v2__filters button')).to.have.lengthOf(2);
  });
});