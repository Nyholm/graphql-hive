import { SafeIntResolver } from 'graphql-scalars';
import type { SharedModule } from './__generated__/types';

SafeIntResolver.description = undefined;

export const resolvers: SharedModule.Resolvers = {
  SafeInt: SafeIntResolver,
};
