import { SupportModule } from './__generated__/types';
import { SupportTicketPriority, SupportTicketStatus } from './../../shared/entities';
import { SupportManager } from './providers/support-manager';

export const resolvers: SupportModule.Resolvers & {
  SupportTicketPriority: {
    [K in SupportModule.SupportTicketPriority]: SupportTicketPriority;
  };
  SupportTicketStatus: {
    [K in SupportModule.SupportTicketStatus]: SupportTicketStatus;
  };
} = {
  SupportTicket: {
    async comments(ticket, args, { injector }) {
      const response = await injector.get(SupportManager).getTicketComments(ticket.id);

      return {
        edges: response.nodes.map(comment => ({
          node: {
            id: String(comment.id),
            body: comment.body,
            createdAt: comment.created_at,
            fromSupport: comment.fromSupport,
          },
          cursor: String(comment.id),
        })),
        pageInfo: {
          endCursor: String(response.nodes[response.nodes.length - 1]?.id ?? ''),
          hasNextPage: response.meta.has_more,
          hasPreviousPage: false,
          startCursor: String(response.nodes[0]?.id ?? ''),
        },
      };
    },
  },
  SupportTicketStatus: {
    OPEN: SupportTicketStatus.OPEN,
    SOLVED: SupportTicketStatus.SOLVED,
  },
  SupportTicketPriority: {
    NORMAL: SupportTicketPriority.NORMAL,
    HIGH: SupportTicketPriority.HIGH,
    URGENT: SupportTicketPriority.URGENT,
  },
};
