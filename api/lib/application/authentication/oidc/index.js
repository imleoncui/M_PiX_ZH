const Joi = require('joi');
const OidcIdentityProviders = require('../../../domain/constants/oidc-identity-providers');
const oidcController = require('./oidc-controller');
const featureToggles = require('../../preHandlers/feature-toggles');

exports.register = async (server) => {
  server.route([
    {
      method: 'GET',
      path: '/api/oidc/redirect-logout-url',
      config: {
        validate: {
          query: Joi.object({
            identity_provider: Joi.string().required().valid(OidcIdentityProviders.POLE_EMPLOI.code),
            logout_url_uuid: Joi.string()
              .regex(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
              .required(),
          }),
        },
        handler: oidcController.getRedirectLogoutUrl,
        notes: [
          "Cette route reçoit un identity provider ainsi qu'une uri de redirection" +
            " et renvoie une uri de déconnexion auprès de l'identity provider renseigné.",
        ],
        tags: ['api', 'oidc', 'authentication'],
      },
    },
    {
      method: 'GET',
      path: '/api/oidc/authentication-url',
      config: {
        auth: false,
        validate: {
          query: Joi.object({
            identity_provider: Joi.string().required(),
            redirect_uri: Joi.string().required(),
          }),
        },
        handler: oidcController.getAuthenticationUrl,
        notes: [
          "- Cette route permet de récupérer l'url d'authentification du partenaire.\n" +
            '- Elle retournera également les valeurs state et nonce.',
        ],
        tags: ['api', 'oidc', 'authentication'],
      },
    },
    {
      method: 'POST',
      path: '/api/oidc/token',
      config: {
        auth: { mode: 'optional' },
        validate: {
          payload: Joi.object({
            data: {
              attributes: {
                identity_provider: Joi.string().required(),
                code: Joi.string().required(),
                redirect_uri: Joi.string().required(),
                state_sent: Joi.string().required(),
                state_received: Joi.string().required(),
              },
            },
          }),
        },
        handler: oidcController.authenticateUser,
        notes: [
          "- Cette route permet de récupérer un token pour un utilisateur provenant d'un partenaire.\n" +
            "- Elle retournera également un access token Pix correspondant à l'utilisateur.",
        ],
        tags: ['api', 'authentication', 'oidc'],
      },
    },
    {
      method: 'POST',
      path: '/api/oidc/users',
      config: {
        auth: false,
        validate: {
          payload: Joi.object({
            data: {
              attributes: {
                identity_provider: Joi.string().required(),
                authentication_key: Joi.string().required(),
              },
            },
          }),
        },
        handler: oidcController.createUser,
        notes: [
          "'- Cette route permet de créer un compte Pix pour un utilisateur provenant d'un partenaire.\n'" +
            "- Elle retournera un access token Pix correspondant à l'utilisateur.",
        ],
        tags: ['api', 'oidc', 'authentication'],
      },
    },
    {
      method: 'POST',
      path: '/api/oidc/token-reconciliation',
      config: {
        auth: false,
        pre: [
          {
            method: featureToggles.checkIfSsoAccountReconciliationIsEnabled,
            assign: 'checkIfSsoAccountReconciliationIsEnabled',
          },
        ],
        validate: {
          payload: Joi.object({
            data: Joi.object({
              attributes: Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().required(),
                'identity-provider': Joi.string().required().valid('POLE_EMPLOI', 'CNAV'),
                'authentication-key': Joi.string().required(),
              }),
              type: Joi.string(),
            }),
          }),
        },
        handler: oidcController.findUserForReconciliation,
        notes: [
          "- Cette route permet d'identifier un utilisateur Pix provenant de la double mire oidc.\n" +
            '- Elle retournera un access token et une uri de déconnexion',
        ],
        tags: ['api', 'oidc'],
      },
    },
  ]);
};

exports.name = 'oidc-authentication-api';
