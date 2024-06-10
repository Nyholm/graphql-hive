import { SupportModule } from './__generated__/types';
import { SupportTicketPriority, SupportTicketStatus } from './../../shared/entities';

export const resolvers: SupportModule.Resolvers & {
  SupportTicketPriority: {
    [K in SupportModule.SupportTicketPriority]: SupportTicketPriority;
  };
  SupportTicketStatus: {
    [K in SupportModule.SupportTicketStatus]: SupportTicketStatus;
  };
} = {
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
