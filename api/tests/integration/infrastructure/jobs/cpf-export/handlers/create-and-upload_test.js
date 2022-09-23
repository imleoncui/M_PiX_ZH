const { domainBuilder, expect, sinon } = require('../../../../../test-helper');
const createAndUpload = require('../../../../../../lib/infrastructure/jobs/cpf-export/handlers/create-and-upload');
const { createUnzip } = require('node:zlib');

const { PassThrough } = require('stream');

describe('Integration | Infrastructure | jobs | cpf-export | create-and-upload', function () {
  let cpfCertificationResultRepository;
  let cpfCertificationXmlExportService;
  let cpfExternalStorage;
  let clock;
  const expectedFileName = 'pix-cpf-export-20220101-114327000.xml.gz';

  beforeEach(function () {
    clock = sinon.useFakeTimers(new Date('2022-01-01T10:43:27Z'));

    cpfCertificationResultRepository = {
      findByCertificationCourseIds: sinon.stub(),
      markCertificationCoursesAsExported: sinon.stub(),
    };
    cpfCertificationXmlExportService = {
      buildXmlExport: sinon.stub(),
    };
    cpfExternalStorage = {
      upload: sinon.stub(),
    };
  });

  afterEach(function () {
    clock.restore();
  });

  it('should build an xml export file and upload it to an external storage', async function () {
    // given
    const certificationCourseIds = [12, 20, 33, 98, 114];

    const cpfCertificationResults = [
      domainBuilder.buildCpfCertificationResult({ id: 12 }),
      domainBuilder.buildCpfCertificationResult({ id: 20 }),
      domainBuilder.buildCpfCertificationResult({ id: 33 }),
      domainBuilder.buildCpfCertificationResult({ id: 98 }),
      domainBuilder.buildCpfCertificationResult({ id: 114 }),
    ];

    cpfCertificationResultRepository.findByCertificationCourseIds.resolves(cpfCertificationResults);

    cpfCertificationXmlExportService.buildXmlExport
      .withArgs({
        cpfCertificationResults,
        writableStream: sinon.match(PassThrough),
      })
      .callsFake(async ({ cpfCertificationResults, writableStream }) => {
        await writableStream.write(JSON.stringify(cpfCertificationResults));
        return writableStream.end();
      });

    cpfExternalStorage.upload
      .withArgs({
        filename: expectedFileName,
        writableStream: sinon.match(PassThrough),
      })
      .callsFake(async ({ writableStream }) => {
        const unzip = createUnzip();
        const unziped = writableStream.pipe(unzip);
        const readableFile = await _streamToString(unziped);

        expect(readableFile).to.equals(JSON.stringify(cpfCertificationResults));
      });

    // when
    await createAndUpload({
      data: { certificationCourseIds },
      cpfCertificationResultRepository,
      cpfCertificationXmlExportService,
      cpfExternalStorage,
    });

    expect(cpfCertificationResultRepository.findByCertificationCourseIds).to.have.been.calledWith({
      certificationCourseIds,
    });
    expect(cpfCertificationResultRepository.markCertificationCoursesAsExported).to.have.been.calledWith({
      certificationCourseIds,
      filename: expectedFileName,
    });
  });
});

function _streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
