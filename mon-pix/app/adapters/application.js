import { inject as service } from '@ember/service';
import JSONAPIAdapter from '@ember-data/adapter/json-api';
import ENV from 'mon-pix/config/environment';

const FRENCH_DOMAIN_EXTENSION = 'fr';
const FRENCH_LOCALE = 'fr-fr';
const FRENCHSPOKEN_LOCALE = 'fr';

export default class Application extends JSONAPIAdapter {
  @service currentDomain;
  @service ajaxQueue;
  @service intl;
  @service session;

  host = ENV.APP.API_HOST;
  namespace = 'api';

  get headers() {
    const headers = {};
    if (this.session.isAuthenticated) {
      headers['Authorization'] = `Bearer ${this.session.data.authenticated.access_token}`;
    }
    headers['Accept-Language'] = this._locale;
    return headers;
  }

  ajax() {
    return this.ajaxQueue.add(() => super.ajax(...arguments));
  }

  get _locale() {
    const currentLocale = this.intl.get('locale')[0];
    if (currentLocale === 'fr') {
      return this.currentDomain.getExtension() === FRENCH_DOMAIN_EXTENSION ? FRENCH_LOCALE : FRENCHSPOKEN_LOCALE;
    }
    return currentLocale;
  }

  handleResponse(status, headers, payload) {
    if (status === 401 && payload.errors[0].code === 'SESSION_EXPIRED') {
      return this.session.invalidate();
    }

    return super.handleResponse(...arguments);
  }
}
