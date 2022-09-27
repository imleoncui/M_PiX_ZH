const usecases = require('../../domain/usecases');
const certificationResultUtils = require('../../infrastructure/utils/csv/certification-results');
const moment = require('moment');

module.exports = {
  async getCleaCertifiedCandidateDataCsv(request, h) {
    const sessionId = request.params.sessionId;
    const { session, cleaCertifiedCandidateData } = await usecases.getCleaCertifiedCandidateBySession(sessionId);
    const csvResult = await certificationResultUtils.getCleaCertifiedCandidateCsv(cleaCertifiedCandidateData);

    const dateWithTime = moment(session.date + ' ' + session.time, 'YYYY-MM-DD HH:mm');
    const fileName = `${dateWithTime.format('YYYYMMDD_HHmm')}_candidats_certifies_clea_${sessionId}.csv`;

    return h
      .response(csvResult)
      .header('Content-Type', 'text/csv;charset=utf-8')
      .header('Content-Disposition', `attachment; filename=${fileName}`);
  },
};
