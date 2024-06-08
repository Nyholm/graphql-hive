/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './../../__generated__/types.next';
import { Date } from './resolvers/Date';
import { DateTime } from './resolvers/DateTime';
import { JSON } from './resolvers/JSON';
import { JSONSchemaObject } from './resolvers/JSONSchemaObject';
import { noop as Mutation_noop } from './resolvers/Mutation/noop';
import { noop as Query_noop } from './resolvers/Query/noop';
import { SafeInt } from './resolvers/SafeInt';

export const resolvers: Resolvers = {
  Query: { noop: Query_noop },
  Mutation: { noop: Mutation_noop },

  Date: Date,
  DateTime: DateTime,
  JSON: JSON,
  JSONSchemaObject: JSONSchemaObject,
  SafeInt: SafeInt,
};
