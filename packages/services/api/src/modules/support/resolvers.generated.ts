/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
import type { Resolvers } from './../../__generated__/types.next';
import { supportTicketCreate as Mutation_supportTicketCreate } from './resolvers/Mutation/supportTicketCreate';
import { supportTicketReply as Mutation_supportTicketReply } from './resolvers/Mutation/supportTicketReply';
import { Organization as support_Organization } from './resolvers/Organization';
import { SupportTicket } from './resolvers/SupportTicket';
import { SupportTicketPriority } from './resolvers/SupportTicketPriority';
import { SupportTicketStatus } from './resolvers/SupportTicketStatus';

export const resolvers: Resolvers = {
  Mutation: {
    supportTicketCreate: Mutation_supportTicketCreate,
    supportTicketReply: Mutation_supportTicketReply,
  },

  Organization: support_Organization,
  SupportTicket: SupportTicket,
  SupportTicketPriority: SupportTicketPriority,
  SupportTicketStatus: SupportTicketStatus,
};
