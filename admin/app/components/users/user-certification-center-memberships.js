import Component from '@glimmer/component';

export default class UserCertificationCenterMemberships extends Component {
  get orderedCertificationCenterMemberships() {
    return this.args.certificationCenterMemberships.sortBy('certificationCenterName');
  }
}
