import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {

  @service splash;
  @service session;
  @service intl;
  @service headData;
  @service featureToggles;

  activate() {
    this.splash.hide();
  }

  async beforeModel(transition) {
    this.headData.description = this.intl.t('application.description');
    await this.featureToggles.load().catch();

    return this.session.handleUserLanguageAndLocale(transition);
  }
}
