const OrganizationForAdmin = require('../../../../lib/domain/models/OrganizationForAdmin');

function buildOrganizationForAdmin({
  id = 123,
  name = 'Lycée Luke Skywalker',
  type = 'SCO',
  logoUrl = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
  externalId = 'OrganizationIdLinksToExternalSource',
  provinceCode = '2A',
  isManagingStudents = false,
  credit = 500,
  email = 'jesuistonpere@example.net',
  createdAt = new Date('2018-01-12T01:02:03Z'),
  targetProfileShares = [],
  tags = [],
  createdBy,
  documentationUrl = 'https://pix.fr',
  showNPS = false,
  formNPSUrl = 'https://pix.fr',
  showSkills = false,
  archivedAt = null,
  archivistFirstName = null,
  archivistLastName = null,
} = {}) {
  return new OrganizationForAdmin({
    id,
    name,
    type,
    logoUrl,
    externalId,
    provinceCode,
    isManagingStudents,
    credit,
    email,
    createdAt,
    targetProfileShares,
    tags,
    createdBy,
    documentationUrl,
    showNPS,
    formNPSUrl,
    showSkills,
    archivedAt,
    archivistFirstName,
    archivistLastName,
  });
}

module.exports = buildOrganizationForAdmin;