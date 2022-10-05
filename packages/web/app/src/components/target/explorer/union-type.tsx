import { graphql, FragmentType, useFragment } from '@/gql';
import { GraphQLTypeCard, GraphQLTypeCardListItem, SchemaExplorerUsageStats } from './common';

export const GraphQLUnionTypeComponent_TypeFragment = graphql(/* GraphQL */ `
  fragment GraphQLUnionTypeComponent_TypeFragment on GraphQLUnionType {
    name
    description
    usage {
      ...SchemaExplorerUsageStats_UsageFragment
    }
    members {
      name
      usage {
        ...SchemaExplorerUsageStats_UsageFragment
      }
    }
  }
`);

export function GraphQLUnionTypeComponent(props: {
  type: FragmentType<typeof GraphQLUnionTypeComponent_TypeFragment>;
  totalRequests: number;
}) {
  const unionType = useFragment(GraphQLUnionTypeComponent_TypeFragment, props.type);
  return (
    <GraphQLTypeCard name={unionType.name} kind="union" description={unionType.description}>
      <div className="flex flex-col">
        {unionType.members.map((member, i) => (
          <GraphQLTypeCardListItem index={i}>
            <div>{member.name}</div>
            <SchemaExplorerUsageStats totalRequests={props.totalRequests} usage={member.usage} />
          </GraphQLTypeCardListItem>
        ))}
      </div>
    </GraphQLTypeCard>
  );
}
