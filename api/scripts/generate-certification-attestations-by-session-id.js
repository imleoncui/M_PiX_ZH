'use strict';
require('dotenv').config({ path: `${__dirname}/../.env` });

const fs = require('fs');
const bluebird = require('bluebird');
const isEmpty = require('lodash/isEmpty');
const compact = require('lodash/compact');
const logger = require('../lib/infrastructure/logger');
const certificationAttestationRepository = require('../lib/infrastructure/repositories/certification-attestation-repository');
const certificationCourseRepository = require('../lib/infrastructure/repositories/certification-course-repository');
const certificationAttestationPdf = require('../lib/infrastructure/utils/pdf/certification-attestation-pdf');
const { NotFoundError } = require('../lib/domain/errors');

/**
 * Avant de lancer le script, remplacer la variable DATABASE_URL par l'url de la base de réplication
 * Usage: NODE_TLS_REJECT_UNAUTHORIZED='0' PGSSLMODE=require node scripts/generate-certification-attestations-by-session-id.js 1234
 */
async function main() {
  logger.info("Début du script de génération d'attestations pour une session.");
  const sessionId = process.argv[2];

  if (!sessionId) {
    throw new Error('Le paramêtre représentant le numéro de session est obligatoire.');
  }

  const certificationCourses = await certificationCourseRepository.findCertificationCoursesBySessionId({ sessionId });

  if (isEmpty(certificationCourses)) {
    throw new Error(`Pas de certifications trouvées pour la session ${sessionId}`);
  }

  const certificationAttestations = compact(
    await bluebird.mapSeries(certificationCourses, async (certificationCourse) => {
      try {
        return await certificationAttestationRepository.get(certificationCourse.getId());
      } catch (error) {
        if (error instanceof NotFoundError) {
          return null;
        }
        throw error;
      }
    })
  );

  if (isEmpty(certificationAttestations)) {
    throw new Error(`Pas d'attesations trouvées pour la session ${sessionId}`);
  }

  logger.info(`Attestations pour la session ${sessionId} récupérées.`);

  const { buffer } = await certificationAttestationPdf.getCertificationAttestationsPdfBuffer({
    certificates: certificationAttestations,
  });

  logger.info(`Génération du fichier pdf.`);

  // eslint-disable-next-line no-sync
  fs.writeFileSync(`attestation-pix-session-${sessionId}.pdf`, buffer);

  logger.info('Fin du script.');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error(err.message);
      process.exit(1);
    });
}
