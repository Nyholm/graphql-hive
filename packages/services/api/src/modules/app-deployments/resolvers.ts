import { AppDeploymentsModule } from './__generated__/types';
import { AppDeploymentsManager } from './providers/app-deployments-manager';

export const resolvers: AppDeploymentsModule.Resolvers = {
  Target: {
    appDeployment(target, args, { injector }) {
      return injector.get(AppDeploymentsManager).getAppDeploymentForTarget(target, {
        name: args.appName,
        version: args.appVersion,
      });
    },
  },
  AppDeployment: {
    status(appDeployment, _, { injector }) {
      return injector.get(AppDeploymentsManager).getStatusForAppDeployment(appDeployment);
    },
  },
  Mutation: {
    async createAppDeployment(_, { input }, { injector }) {
      const result = await injector.get(AppDeploymentsManager).createAppDeployment({
        appDeployment: {
          name: input.appName,
          version: input.appVersion,
        },
      });

      if (result.type === 'error') {
        return {
          error: {
            message: result.error.message,
            details: result.error.details,
          },
          ok: null,
        };
      }

      return {
        error: null,
        ok: {
          createdAppDeployment: result.appDeployment,
        },
      };
    },
    async addDocumentsToAppDeployment(_, { input }, { injector }) {
      const result = await injector.get(AppDeploymentsManager).addDocumentsToAppDeployment({
        appDeployment: {
          name: input.appName,
          version: input.appVersion,
        },
        documents: input.documents,
      });

      if (result.type === 'error') {
        return {
          error: {
            message: result.error.message,
            details: result.error.details,
          },
          ok: null,
        };
      }

      return {
        error: null,
        ok: {
          appDeployment: result.appDeployment,
        },
      };
    },
    async activateAppDeployment(_, { input }, { injector }) {
      const result = await injector.get(AppDeploymentsManager).activateAppDeployment({
        appDeployment: {
          name: input.appName,
          version: input.appVersion,
        },
      });

      if (result.type === 'error') {
        return {
          error: {
            message: result.message,
          },
          ok: null,
        };
      }

      return {
        error: null,
        ok: {
          activatedAppDeployment: result.appDeployment,
        },
      };
    },
    async retireAppDeployment(_, { input }, { injector }) {
      const result = await injector.get(AppDeploymentsManager).retireAppDeployment({
        targetId: input.targetId,
        appDeployment: {
          name: input.appName,
          version: input.appVersion,
        },
      });

      if (result.type === 'error') {
        return {
          error: {
            message: result.message,
          },
          ok: null,
        };
      }

      return {
        error: null,
        ok: {
          retiredAppDeployment: result.appDeployment,
        },
      };
    },
  },
};
