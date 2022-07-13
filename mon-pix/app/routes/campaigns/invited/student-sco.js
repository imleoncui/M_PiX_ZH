import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import get from 'lodash/get';

export default class StudentScoRoute extends Route {
  @service currentUser;
  @service campaignStorage;
  @service store;
  @service session;
  @service router;

  beforeModel(transition) {
    this.session.requireAuthenticationAndApprovedTermsOfService(transition);
  }

  model() {
    return this.modelFor('campaigns');
  }

  async afterModel(campaign) {
    let schoolingRegistration = await this.store.queryRecord('schooling-registration-user-association', {
      userId: this.currentUser.user.id,
      campaignCode: campaign.code,
    });

    if (!schoolingRegistration) {
      try {
        schoolingRegistration = await this.store
          .createRecord('schooling-registration-user-association', {
            userId: this.currentUser.user.id,
            campaignCode: campaign.code,
          })
          .save({ adapterOptions: { tryReconciliation: true } });
      } catch (error) {
        if (get(error, 'errors[0].status') !== '422') {
          throw error;
        }
      }
    }

    if (schoolingRegistration) {
      this.campaignStorage.set(campaign.code, 'associationDone', true);
      this.router.replaceWith('campaigns.invited.fill-in-participant-external-id', campaign.code);
    }
  }
}
