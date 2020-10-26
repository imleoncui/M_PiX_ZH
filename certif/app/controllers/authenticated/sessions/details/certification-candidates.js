import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import every from 'lodash/every';
import { computed } from '@ember/object';
import { action } from '@ember/object';

export default class CertificationCandidatesController extends Controller {

  @alias('model.session') currentSession;
  @alias('model.certificationCandidates') certificationCandidates;
  @alias('model.reloadCertificationCandidate') reloadCertificationCandidate;
  @alias('model.isUserFromSco') isUserFromSco;
  @alias('model.isCertifPrescriptionScoEnabled') isCertifPrescriptionScoEnabled;

  @computed('certificationCandidates', 'certificationCandidates.@each.isLinked')
  get importAllowed() {
    return every(this.certificationCandidates.toArray(), (certificationCandidate) => {
      return !certificationCandidate.isLinked;
    });
  }

  @action
  async reloadCertificationCandidateInController() {
    await this.reloadCertificationCandidate();
  }
}
