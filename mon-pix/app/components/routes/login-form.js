/* eslint ember/no-classic-components: 0 */
/* eslint ember/require-tagless-components: 0 */

import { action, computed } from '@ember/object';
import { inject } from '@ember/service';
import Component from '@ember/component';
import classic from 'ember-classic-decorator';
import get from "lodash/get";

@classic
export default class LoginForm extends Component {

  @inject session;
  @inject store;
  @inject router;
  @inject currentUser;

  login = null;
  password = null;

  externalUserToken = null;

  isLoading = false;
  isPasswordVisible = false;
  isErrorMessagePresent = false;
  hasUpdateUserError = false;
  updateErrorMessage = '';

  @computed('isPasswordVisible')
  get passwordInputType() {
    return this.isPasswordVisible ? 'text' : 'password';
  }

  @action
  async authenticate() {
    this.set('isLoading', true);

    const login = this.login;
    const password = this.password;

    this.set('externalUserToken', this.session.get('data.externalUser'));

    await this._authenticate(password, login);
    await this._addGarAuthenticationMethodToUser();

    this.set('isLoading', false);
  }

  @action
  togglePasswordVisibility() {
    this.toggleProperty('isPasswordVisible');
  }

  async _authenticate(password, login) {
    const scope = 'mon-pix';

    if (this.externalUserToken) {
      this.session.set('attemptedTransition', {
        retry: () => {
        }
      });
    }

    try {
      await this.session.authenticate('authenticator:oauth2', { login, password, scope });
    } catch (err) {
      const title = ('errors' in err) ? err.errors.get('firstObject').title : null;
      if (title === 'PasswordShouldChange') {
        this.store.createRecord('user', { username: this.login, password: this.password });
        return this.router.replaceWith('update-expired-password');
      }
      this.set('isErrorMessagePresent', true);
    }
  }

  async _addGarAuthenticationMethodToUser() {
    if (this.externalUserToken) {
      try {
        await this.addGarAuthenticationMethodToUser(this.externalUserToken);
      } catch (errors) {
        //debugger;
        this.set('hasUpdateUserError', true);
        const defaultErrorMessage = 'Une erreur interne est survenue, nos équipes sont en train de résoudre le problème. Veuillez réessayer ultérieurement.';

        const error = errors[0];
        let errorMessage = defaultErrorMessage;
        const statusCode = get(error, 'status');
        if (statusCode.startsWith('4')) {
          errorMessage = 'Les données que vous avez soumises ne sont pas au bon format.';
        }
        this.set('updateErrorMessage', errorMessage);
      }
    }
  }

}
