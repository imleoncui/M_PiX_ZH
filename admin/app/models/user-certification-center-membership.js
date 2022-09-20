import Model, { attr } from '@ember-data/model';

export default class UserCertificationCenterMembership extends Model {
  @attr() disabledAt;
  @attr() certificationCenterId;
  @attr() certificationCenterName;
  @attr() certificationCenterType;
  @attr() certificationCenterExternalId;
}
