import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import get from 'lodash/get';
import IdentityProviders from 'mon-pix/identity-providers';

const ERROR_INPUT_MESSAGE_MAP = {
  termsOfServiceNotSelected: 'pages.terms-of-service-oidc.form.error-message',
  unknownError: 'common.error',
  expiredAuthenticationKey: 'pages.terms-of-service-oidc.form.expired-authentication-key',
};

export default class TermsOfServiceOidcComponent extends Component {
  @service url;
  @service intl;
  @service session;

  @tracked isTermsOfServiceValidated = false;
  @tracked isAuthenticationKeyExpired = false;
  @tracked errorMessage = null;

  get homeUrl() {
    return this.url.homeUrl;
  }

  get identityProviderOrganizationName() {
    return IdentityProviders[this.args.identityProviderSlug].organizationName;
  }

  @action
  async submit() {
    if (this.isTermsOfServiceValidated) {
      this.errorMessage = null;
      try {
        await this.session.authenticate('authenticator:oidc', {
          authenticationKey: this.args.authenticationKey,
          identityProviderSlug: this.args.identityProviderSlug,
        });
      } catch (error) {
        const status = get(error, 'errors[0].status');
        if (status === '401') {
          this.isAuthenticationKeyExpired = true;
          this.errorMessage = this.intl.t(ERROR_INPUT_MESSAGE_MAP['expiredAuthenticationKey']);
        } else {
          const errorDetail = get(error, 'errors[0].detail');
          this.errorMessage =
            this.intl.t(ERROR_INPUT_MESSAGE_MAP['unknownError']) + (errorDetail ? ` (${errorDetail})` : '');
        }
      }
    } else {
      this.errorMessage = this.intl.t(ERROR_INPUT_MESSAGE_MAP['termsOfServiceNotSelected']);
    }
  }

  @action
  onChange(event) {
    this.isTermsOfServiceValidated = !!event.target.checked;
  }
}