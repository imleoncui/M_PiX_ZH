const { PassThrough } = require('stream');
const moment = require('moment-timezone');
const { createGzip } = require('node:zlib');

module.exports = async function createAndUpload({
  data,
  cpfCertificationResultRepository,
  cpfCertificationXmlExportService,
  cpfExternalStorage,
}) {
  const { certificationCourseIds } = data;
  const cpfCertificationResults = await cpfCertificationResultRepository.findByCertificationCourseIds({
    certificationCourseIds,
  });

  const writableStream = new PassThrough();
  await cpfCertificationXmlExportService.buildXmlExport({ cpfCertificationResults, writableStream });

  //const gzip = createGzip();
  const now = moment().tz('Europe/Paris').format('YYYYMMDD-HHmmssSSS');
  const filename = `pix-cpf-export-${now}.xml`;
  await cpfExternalStorage.upload({ filename, writableStream });

  await cpfCertificationResultRepository.markCertificationCoursesAsExported({ certificationCourseIds, filename });
};
