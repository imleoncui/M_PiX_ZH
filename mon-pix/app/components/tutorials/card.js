import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import buttonStatusTypes from 'mon-pix/utils/button-status-types';
import { inject as service } from '@ember/service';

export default class Card extends Component {
  @service intl;
  @service store;

  @tracked savingStatus;
  @tracked evaluationStatus;

  constructor(owner, args) {
    super(owner, args);
    this.savingStatus = args.tutorial.isSaved ? buttonStatusTypes.recorded : buttonStatusTypes.unrecorded;
    this.evaluationStatus = args.tutorial.isEvaluated ? buttonStatusTypes.recorded : buttonStatusTypes.unrecorded;
  }

  get saveInformation() {
    return this.savingStatus === buttonStatusTypes.recorded
      ? this.intl.t('pages.user-tutorials.list.tutorial.actions.remove.label')
      : this.intl.t('pages.user-tutorials.list.tutorial.actions.save.label');
  }

  get evaluateInformation() {
    return this.evaluationStatus === buttonStatusTypes.recorded
      ? this.intl.t('pages.user-tutorials.list.tutorial.actions.evaluate.label')
      : this.intl.t('pages.user-tutorials.list.tutorial.actions.evaluate.extra-information');
  }

  get isSaved() {
    return this.savingStatus === buttonStatusTypes.recorded;
  }

  get isTutorialEvaluated() {
    return this.evaluationStatus !== buttonStatusTypes.unrecorded;
  }

  get isEvaluationButtonDisabled() {
    return this.evaluationStatus === buttonStatusTypes.pending;
  }

  get isTutorialSaved() {
    return this.savingStatus !== buttonStatusTypes.unrecorded;
  }

  get isSaveButtonDisabled() {
    return this.savingStatus === buttonStatusTypes.pending;
  }

  @action
  async toggleSaveTutorial() {
    if (this.isSaved) {
      await this._removeTutorial();
    } else {
      await this._saveTutorial();
    }
  }

  async _saveTutorial() {
    this.savingStatus = buttonStatusTypes.pending;
    try {
      const userTutorial = this.store.createRecord('userTutorial', { tutorial: this.args.tutorial });
      await userTutorial.save({ adapterOptions: { tutorialId: this.args.tutorial.id } });
      this.savingStatus = buttonStatusTypes.recorded;
    } catch (e) {
      this.savingStatus = buttonStatusTypes.unrecorded;
    }
  }

  async _removeTutorial() {
    this.savingStatus = buttonStatusTypes.pending;
    try {
      await this.args.tutorial.userTutorial.destroyRecord({ adapterOptions: { tutorialId: this.args.tutorial.id } });
      this.savingStatus = buttonStatusTypes.unrecorded;
    } catch (e) {
      this.savingStatus = buttonStatusTypes.recorded;
    }
    await this.args.afterRemove?.();
  }

  @action
  async evaluateTutorial() {
    this.evaluationStatus = buttonStatusTypes.pending;
    const tutorial = this.args.tutorial;
    const tutorialEvaluation =
      tutorial.tutorialEvaluation ?? this.store.createRecord('tutorialEvaluation', { tutorial: tutorial });
    try {
      await tutorialEvaluation.save({
        adapterOptions: { tutorialId: tutorial.id, status: tutorialEvaluation.nextStatus },
      });
    } catch (e) {
      throw new Error("Un problème est survenu lors de la mise à jour de l'évaluation du tutoriel");
    } finally {
      this.evaluationStatus = tutorialEvaluation.isLiked ? buttonStatusTypes.recorded : buttonStatusTypes.unrecorded;
    }
  }
}
