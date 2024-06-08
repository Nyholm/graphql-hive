import { DateResolver, DateTimeResolver, SafeIntResolver } from 'graphql-scalars';
import type { SharedModule } from './__generated__/types';

DateTimeResolver.description = undefined;
SafeIntResolver.description = undefined;
DateResolver.description = undefined;

export const resolvers: SharedModule.Resolvers = {
  Date: DateResolver,
  DateTime: DateTimeResolver,
  SafeInt: SafeIntResolver,
};
