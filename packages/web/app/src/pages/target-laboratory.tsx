import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import { buildSchema } from 'graphql';
import { useMutation, useQuery } from 'urql';
import { Page, TargetLayout } from '@/components/layouts/target';
import { ConnectLabModal } from '@/components/target/laboratory/connect-lab-modal';
import { CreateCollectionModal } from '@/components/target/laboratory/create-collection-modal';
import { CreateOperationModal } from '@/components/target/laboratory/create-operation-modal';
import { DeleteCollectionModal } from '@/components/target/laboratory/delete-collection-modal';
import { DeleteOperationModal } from '@/components/target/laboratory/delete-operation-modal';
import { Button } from '@/components/ui/button';
import { DocsLink } from '@/components/ui/docs-note';
import { Link } from '@/components/ui/link';
import { Subtitle, Title } from '@/components/ui/page';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion } from '@/components/v2/accordion';
import { HiveLogo, PlusIcon, SaveIcon, ShareIcon } from '@/components/v2/icon';
import { Spinner } from '@/components/v2/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/v2/toggle-group';
import { Tooltip as LegacyTooltip } from '@/components/v2/tooltip';
import { graphql } from '@/gql';
import { TargetAccessScope } from '@/gql/graphql';
import { canAccessTarget } from '@/lib/access/target';
import { useClipboard, useNotifications, useToggle } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import {
  Button as GraphiQLButton,
  DropdownMenu as GraphiQLDropdownMenu,
  GraphiQLPlugin,
  Tooltip as GraphiQLTooltip,
  useEditorContext,
} from '@graphiql/react';
import { createGraphiQLFetcher, Fetcher, isAsyncIterable } from '@graphiql/toolkit';
import { BookmarkIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import 'graphiql/graphiql.css';
import { cx } from 'class-variance-authority';
import clsx from 'clsx';
import { Helmet } from 'react-helmet-async';
import { EditOperationModal } from '@/components/target/laboratory/edit-operation-modal';
import { Meta } from '@/components/ui/meta';
import { QueryError } from '@/components/ui/query-error';
import { useResetState } from '@/lib/hooks/use-reset-state';
import { Repeater } from '@repeaterjs/repeater';
import { Link as RouterLink, useRouter } from '@tanstack/react-router';

function Share(props: { operation: string | null }): ReactElement {
  const label = 'Share query';
  const copyToClipboard = useClipboard();

  return (
    <GraphiQLTooltip label={label}>
      <GraphiQLButton
        className="graphiql-toolbar-button"
        aria-label={label}
        disabled={!props.operation}
        onClick={async () => {
          await copyToClipboard(window.location.href);
        }}
      >
        <ShareIcon className="graphiql-toolbar-icon" />
      </GraphiQLButton>
    </GraphiQLTooltip>
  );
}

const OperationQuery = graphql(`
  query Operation($selector: TargetSelectorInput!, $id: ID!) {
    target(selector: $selector) {
      id
      documentCollectionOperation(id: $id) {
        id
        name
        query
        headers
        variables
        updatedAt
        collection {
          id
          name
        }
      }
    }
  }
`);

function useCurrentOperation(props: {
  organizationId: string;
  projectId: string;
  targetId: string;
}) {
  const router = useRouter();
  const operationIdFromSearch =
    'operation' in router.latestLocation.search &&
    typeof router.latestLocation.search.operation === 'string'
      ? router.latestLocation.search.operation
      : null;
  const [{ data }] = useQuery({
    query: OperationQuery,
    variables: {
      selector: {
        target: props.targetId,
        project: props.projectId,
        organization: props.organizationId,
      },
      id: operationIdFromSearch!,
    },
    pause: !operationIdFromSearch,
  });
  // if operationId is undefined `data` could contain previous state
  return operationIdFromSearch ? data?.target?.documentCollectionOperation : null;
}

const CreateOperationMutation = graphql(`
  mutation CreateOperation(
    $selector: TargetSelectorInput!
    $input: CreateDocumentCollectionOperationInput!
  ) {
    createOperationInDocumentCollection(selector: $selector, input: $input) {
      error {
        message
      }
      ok {
        operation {
          id
          name
        }
        updatedTarget {
          id
          documentCollections {
            edges {
              cursor
              node {
                id
                operations {
                  edges {
                    node {
                      id
                    }
                    cursor
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

const CollectionItem = (props: {
  node: { id: string; name: string };
  canDelete: boolean;
  canEdit: boolean;
  onDelete: (operationId: string) => void;
  onEdit: (operationId: string) => void;
  isChanged?: boolean;
  organizationId: string;
  projectId: string;
  targetId: string;
}): ReactElement => {
  const router = useRouter();
  const operationIdFromSearch =
    'operation' in router.latestLocation.search &&
    typeof router.latestLocation.search.operation === 'string'
      ? router.latestLocation.search.operation
      : null;
  const copyToClipboard = useClipboard();

  return (
    <div key={props.node.id} className="flex items-center justify-between">
      <Link
        to="/$organizationId/$projectId/$targetId/laboratory"
        params={{
          organizationId: props.organizationId,
          projectId: props.projectId,
          targetId: props.targetId,
        }}
        search={{
          operation: props.node.id,
        }}
        className={cn(
          'flex w-full items-center justify-between rounded p-2 !text-gray-300 hover:bg-gray-100/10',
          operationIdFromSearch === props.node.id && 'bg-gray-100/10 text-white',
        )}
      >
        {props.node.name}
        {props.isChanged && (
          <span className="size-1.5 rounded-full border border-orange-600 bg-orange-400" />
        )}
      </Link>
      <GraphiQLDropdownMenu
        // https://github.com/radix-ui/primitives/issues/1241#issuecomment-1580887090
        modal={false}
      >
        <GraphiQLDropdownMenu.Button
          className="graphiql-toolbar-button opacity-0 transition [div:hover>&]:bg-transparent [div:hover>&]:opacity-100"
          aria-label="More"
          data-cy="operation-3-dots"
        >
          <DotsVerticalIcon />
        </GraphiQLDropdownMenu.Button>

        <GraphiQLDropdownMenu.Content>
          <GraphiQLDropdownMenu.Item
            onSelect={async () => {
              const url = new URL(window.location.href);
              await copyToClipboard(`${url.origin}${url.pathname}?operation=${props.node.id}`);
            }}
          >
            Copy link to operation
          </GraphiQLDropdownMenu.Item>
          {props.canEdit ? (
            <GraphiQLDropdownMenu.Item
              onSelect={async () => {
                props.onEdit(props.node.id);
              }}
            >
              Edit
            </GraphiQLDropdownMenu.Item>
          ) : null}
          {props.canDelete ? (
            <GraphiQLDropdownMenu.Item
              onSelect={() => {
                props.onDelete(props.node.id);
              }}
              className="!text-red-500"
              data-cy="remove-operation"
            >
              Delete
            </GraphiQLDropdownMenu.Item>
          ) : null}
        </GraphiQLDropdownMenu.Content>
      </GraphiQLDropdownMenu>
    </div>
  );
};

const AddCollectionItemButton = (props: {
  collectionId: string;
  organizationId: string;
  projectId: string;
  targetId: string;
}): ReactElement => {
  const [createOperationState, createOperation] = useMutation(CreateOperationMutation);
  const notify = useNotifications();
  const router = useRouter();

  return (
    <Button
      variant="link"
      className="px-2 py-0 text-gray-500 hover:text-white hover:no-underline"
      onClick={async () => {
        const result = await createOperation({
          input: {
            collectionId: props.collectionId,
            name: 'New Operation',
            query: '{}',
            headers: '',
            variables: '',
          },
          selector: {
            target: props.targetId,
            organization: props.organizationId,
            project: props.projectId,
          },
        });
        if (result.error) {
          notify("Couldn't create operation. Please try again later.", 'error');
        }
        if (result.data?.createOperationInDocumentCollection.error) {
          notify(result.data.createOperationInDocumentCollection.error.message, 'error');
        }
        if (result.data?.createOperationInDocumentCollection.ok) {
          void router.navigate({
            to: '/$organizationId/$projectId/$targetId/laboratory',
            params: {
              organizationId: props.organizationId,
              projectId: props.projectId,
              targetId: props.targetId,
            },
            search: {
              operation: result.data.createOperationInDocumentCollection.ok.operation.id,
            },
          });
        }
      }}
      disabled={createOperationState.fetching}
    >
      <PlusIcon size={10} className="mr-1 inline" /> Add Operation
    </Button>
  );
};

export const CollectionsQuery = graphql(`
  query Collections($selector: TargetSelectorInput!) {
    target(selector: $selector) {
      id
      documentCollections {
        edges {
          cursor
          node {
            id
            name
            operations(first: 100) {
              edges {
                node {
                  id
                  name
                }
                cursor
              }
            }
          }
        }
      }
    }
  }
`);

export function useCollections(props: {
  organizationId: string;
  projectId: string;
  targetId: string;
}) {
  const [{ data, error, fetching }] = useQuery({
    query: CollectionsQuery,
    variables: {
      selector: {
        target: props.targetId,
        organization: props.organizationId,
        project: props.projectId,
      },
    },
  });

  const notify = useNotifications();

  useEffect(() => {
    if (error) {
      notify(error.message, 'error');
    }
  }, [error]);

  return {
    collections: data?.target?.documentCollections.edges.map(v => v.node) || [],
    fetching,
  };
}

function useOperationCollectionsPlugin(props: {
  canEdit: boolean;
  canDelete: boolean;
  organizationId: string;
  projectId: string;
  targetId: string;
}): GraphiQLPlugin {
  const { canDelete, canEdit } = props;
  return {
    title: 'Operation Collections',
    icon: BookmarkIcon,
    content: useCallback(
      function Content() {
        const [isCollectionModalOpen, toggleCollectionModal] = useToggle();
        const { collections, fetching: loading } = useCollections({
          organizationId: props.organizationId,
          projectId: props.projectId,
          targetId: props.targetId,
        });
        const [collectionId, setCollectionId] = useState('');
        const [isDeleteCollectionModalOpen, toggleDeleteCollectionModalOpen] = useToggle();
        const [operationToDeleteId, setOperationToDeleteId] = useState<null | string>(null);
        const [operationToEditId, setOperationToEditId] = useState<null | string>(null);
        const { clearOperation, savedOperation, setSavedOperation } = useSyncOperationState({
          organizationId: props.organizationId,
          projectId: props.projectId,
          targetId: props.targetId,
        });
        const router = useRouter();

        const currentOperation = useCurrentOperation({
          organizationId: props.organizationId,
          projectId: props.projectId,
          targetId: props.targetId,
        });
        const editorContext = useEditorContext({ nonNull: true });

        const hasAllEditors = !!(
          editorContext.queryEditor &&
          editorContext.variableEditor &&
          editorContext.headerEditor
        );

        const isSame =
          !!currentOperation &&
          currentOperation.query === editorContext.queryEditor?.getValue() &&
          currentOperation.variables === editorContext.variableEditor?.getValue() &&
          currentOperation.headers === editorContext.headerEditor?.getValue();

        const queryParamsOperationId =
          'operation' in router.latestLocation.search &&
          typeof router.latestLocation.search.operation === 'string'
            ? router.latestLocation.search.operation
            : null;

        useEffect(() => {
          if (!hasAllEditors || !currentOperation) {
            return;
          }

          if (queryParamsOperationId) {
            // Set selected operation in editors
            editorContext.queryEditor?.setValue(currentOperation.query);
            editorContext.variableEditor?.setValue(currentOperation.variables ?? '');
            editorContext.headerEditor?.setValue(currentOperation.headers ?? '');

            if (!savedOperation) {
              return;
            }

            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (savedOperation.updatedAt + oneWeek < Date.now()) {
              clearOperation();
              return;
            }

            const currentOperationUpdatedAt = new Date(currentOperation.updatedAt).getTime();
            if (savedOperation.updatedAt > currentOperationUpdatedAt) {
              editorContext.queryEditor?.setValue(savedOperation.query);
              editorContext.variableEditor?.setValue(savedOperation.variables);
            }
          }
        }, [hasAllEditors, queryParamsOperationId, currentOperation]);

        useEffect(() => {
          if (!hasAllEditors || !currentOperation || isSame) {
            return;
          }
          setSavedOperation({
            query: editorContext.queryEditor?.getValue() ?? '',
            variables: editorContext.variableEditor?.getValue() ?? '',
          });
        }, [editorContext.queryEditor?.getValue(), editorContext.variableEditor?.getValue()]);

        const shouldShowMenu = canEdit || canDelete;

        const initialSelectedCollection =
          currentOperation?.id &&
          collections?.find(c =>
            c.operations.edges.some(({ node }) => node.id === currentOperation.id),
          )?.id;

        return (
          <div className="flex h-full flex-col">
            <div className="flex justify-between">
              <Title>Collections</Title>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (collectionId) {
                          setCollectionId('');
                        }
                        toggleCollectionModal();
                      }}
                    >
                      <PlusIcon className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create new collection</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {loading ? (
              <div className="flex h-fit flex-1 items-center justify-center">
                <div className="flex flex-col items-center">
                  <Spinner />
                  <div className="mt-2 text-xs">Loading collections</div>
                </div>
              </div>
            ) : collections?.length ? (
              <Accordion
                defaultValue={initialSelectedCollection ? [initialSelectedCollection] : undefined}
                className="mt-5 space-y-0"
                type="multiple"
              >
                {collections.map(collection => (
                  <Accordion.Item key={collection.id} value={collection.id}>
                    <div className="flex">
                      <Accordion.Header triggerClassName="pl-1">{collection.name}</Accordion.Header>
                      {shouldShowMenu ? (
                        <GraphiQLDropdownMenu
                          // https://github.com/radix-ui/primitives/issues/1241#issuecomment-1580887090
                          modal={false}
                        >
                          <GraphiQLDropdownMenu.Button
                            className="graphiql-toolbar-button !shrink-0"
                            aria-label="More"
                            data-cy="collection-3-dots"
                          >
                            <DotsVerticalIcon />
                          </GraphiQLDropdownMenu.Button>

                          <GraphiQLDropdownMenu.Content>
                            <GraphiQLDropdownMenu.Item
                              onSelect={() => {
                                setCollectionId(collection.id);
                                toggleCollectionModal();
                              }}
                              data-cy="collection-edit"
                            >
                              Edit
                            </GraphiQLDropdownMenu.Item>
                            <GraphiQLDropdownMenu.Item
                              onSelect={() => {
                                setCollectionId(collection.id);
                                toggleDeleteCollectionModalOpen();
                              }}
                              className="!text-red-500"
                              data-cy="collection-delete"
                            >
                              Delete
                            </GraphiQLDropdownMenu.Item>
                          </GraphiQLDropdownMenu.Content>
                        </GraphiQLDropdownMenu>
                      ) : null}
                    </div>
                    <Accordion.Content className="pr-0">
                      {collection.operations.edges.length
                        ? collection.operations.edges.map(({ node }) => (
                            <CollectionItem
                              key={node.id}
                              node={node}
                              canDelete={canDelete}
                              canEdit={canEdit}
                              onDelete={setOperationToDeleteId}
                              onEdit={setOperationToEditId}
                              isChanged={!isSame && node.id === queryParamsOperationId}
                              organizationId={props.organizationId}
                              projectId={props.projectId}
                              targetId={props.targetId}
                            />
                          ))
                        : null}
                      <AddCollectionItemButton
                        organizationId={props.organizationId}
                        projectId={props.projectId}
                        targetId={props.targetId}
                        collectionId={collection.id}
                      />
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion>
            ) : (
              <div className="flex h-fit flex-1 items-center justify-center">
                <div className="flex flex-col items-center">
                  <BookmarkIcon width={30} height={30} />
                  <div className="mt-2 text-xs">There are no collections available.</div>
                  {canEdit ? (
                    <Button
                      onClick={() => {
                        if (collectionId) {
                          setCollectionId('');
                        }
                        toggleCollectionModal();
                      }}
                      data-cy="create-collection"
                      className="mt-3"
                    >
                      Create your first Collection.
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
            <CreateCollectionModal
              organizationId={props.organizationId}
              projectId={props.projectId}
              targetId={props.targetId}
              isOpen={isCollectionModalOpen}
              toggleModalOpen={toggleCollectionModal}
              collectionId={collectionId}
            />
            <DeleteCollectionModal
              organizationId={props.organizationId}
              projectId={props.projectId}
              targetId={props.targetId}
              isOpen={isDeleteCollectionModalOpen}
              toggleModalOpen={toggleDeleteCollectionModalOpen}
              collectionId={collectionId}
            />
            {operationToDeleteId === null ? null : (
              <DeleteOperationModal
                organizationId={props.organizationId}
                projectId={props.projectId}
                targetId={props.targetId}
                close={() => setOperationToDeleteId(null)}
                operationId={operationToDeleteId}
              />
            )}
            {operationToEditId === null ? null : (
              <EditOperationModal
                organizationId={props.organizationId}
                projectId={props.projectId}
                targetId={props.targetId}
                key={operationToEditId}
                operationId={operationToEditId}
                close={() => setOperationToEditId(null)}
              />
            )}
          </div>
        );
      },
      [canEdit, canDelete],
    ),
  };
}

const UpdateOperationMutation = graphql(`
  mutation UpdateOperation(
    $selector: TargetSelectorInput!
    $input: UpdateDocumentCollectionOperationInput!
  ) {
    updateOperationInDocumentCollection(selector: $selector, input: $input) {
      error {
        message
      }
      ok {
        operation {
          id
          name
          query
          variables
          headers
        }
      }
    }
  }
`);

function useSyncOperationState(props: {
  organizationId: string;
  projectId: string;
  targetId: string;
}): {
  savedOperation: { query: string; variables: string; updatedAt: number } | null;
  setSavedOperation: (value: { query: string; variables: string }) => void;
  clearOperation: () => void;
} {
  const currentOperation = useCurrentOperation({
    organizationId: props.organizationId,
    projectId: props.projectId,
    targetId: props.targetId,
  });
  const storageKey = currentOperation ? `hive:operation-${currentOperation?.id}` : null;
  const savedOperationData = storageKey ? localStorage.getItem(storageKey) : null;
  const operation = savedOperationData ? JSON.parse(savedOperationData) : null;

  const setSavedOperation = (value: { query: string; variables: string }) => {
    if (!storageKey) {
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify({ ...value, updatedAt: Date.now() }));
  };

  const clearOperation = () => {
    if (!storageKey) {
      return;
    }
    localStorage.removeItem(storageKey);
  };

  return {
    savedOperation: operation,
    setSavedOperation,
    clearOperation,
  };
}

function Save(props: {
  organizationId: string;
  projectId: string;
  targetId: string;
}): ReactElement {
  const router = useRouter();
  const [operationModalOpen, toggleOperationModal] = useToggle();
  const { collections } = useCollections({
    organizationId: props.organizationId,
    projectId: props.projectId,
    targetId: props.targetId,
  });
  const notify = useNotifications();
  const currentOperation = useCurrentOperation({
    organizationId: props.organizationId,
    projectId: props.projectId,
    targetId: props.targetId,
  });
  const [, mutateUpdate] = useMutation(UpdateOperationMutation);
  const { queryEditor, variableEditor, headerEditor } = useEditorContext()!;
  const { clearOperation } = useSyncOperationState({
    organizationId: props.organizationId,
    projectId: props.projectId,
    targetId: props.targetId,
  });
  const onSaveSuccess = useCallback(
    (operationId?: string) => {
      if (operationId) {
        void router.navigate({
          to: '/$organizationId/$projectId/$targetId/laboratory',
          params: {
            organizationId: props.organizationId,
            projectId: props.projectId,
            targetId: props.targetId,
          },
          search: {
            operation: operationId,
          },
        });
      }
      clearOperation();
    },
    [clearOperation, router],
  );
  const isSame =
    !!currentOperation &&
    currentOperation.query === queryEditor?.getValue() &&
    currentOperation.variables === variableEditor?.getValue() &&
    currentOperation.headers === headerEditor?.getValue();

  return (
    <>
      <GraphiQLDropdownMenu
        // https://github.com/radix-ui/primitives/issues/1241#issuecomment-1580887090
        modal={false}
      >
        <GraphiQLDropdownMenu.Button
          className="graphiql-toolbar-button relative"
          aria-label="More"
          data-cy="save-operation"
        >
          {!isSame && (
            <span className="absolute right-1 top-1 size-1.5 rounded-full border border-orange-600 bg-orange-400" />
          )}
          <SaveIcon className="graphiql-toolbar-icon !h-5 w-auto" />
        </GraphiQLDropdownMenu.Button>
        <GraphiQLDropdownMenu.Content>
          {!isSame && currentOperation && (
            <GraphiQLDropdownMenu.Item
              disabled={isSame || !currentOperation}
              className="mb-0 text-red-600"
              onClick={async () => {
                queryEditor?.setValue(currentOperation.query);
                clearOperation();
              }}
            >
              Discard changes
            </GraphiQLDropdownMenu.Item>
          )}
          <GraphiQLDropdownMenu.Item
            disabled={isSame || !currentOperation}
            className={cx(
              (isSame || !currentOperation) && 'cursor-default text-gray-400 hover:bg-transparent',
            )}
            onClick={async () => {
              if (!currentOperation || isSame) {
                return;
              }
              const { error, data } = await mutateUpdate({
                selector: {
                  target: props.targetId,
                  organization: props.organizationId,
                  project: props.projectId,
                },
                input: {
                  name: currentOperation.name,
                  collectionId: currentOperation.collection.id,
                  query: queryEditor?.getValue(),
                  variables: variableEditor?.getValue(),
                  headers: headerEditor?.getValue(),
                  operationId: currentOperation.id,
                },
              });
              if (data) {
                clearOperation();
                notify('Updated!', 'success');
              }
              if (error) {
                notify(error.message, 'error');
              }
            }}
          >
            Save
          </GraphiQLDropdownMenu.Item>
          <GraphiQLDropdownMenu.Item
            onClick={async () => {
              if (!collections.length) {
                notify('Please create a collection first.', 'error');
                return;
              }
              toggleOperationModal();
            }}
          >
            Save as
          </GraphiQLDropdownMenu.Item>
        </GraphiQLDropdownMenu.Content>
      </GraphiQLDropdownMenu>
      <CreateOperationModal
        organizationId={props.organizationId}
        projectId={props.projectId}
        targetId={props.targetId}
        isOpen={operationModalOpen}
        close={toggleOperationModal}
        onSaveSuccess={onSaveSuccess}
      />
    </>
  );
}

const TargetLaboratoryPageQuery = graphql(`
  query TargetLaboratoryPageQuery($organizationId: ID!, $projectId: ID!, $targetId: ID!) {
    organization(selector: { organization: $organizationId }) {
      organization {
        id
        me {
          id
          ...CanAccessTarget_MemberFragment
        }
      }
    }
    target(selector: { organization: $organizationId, project: $projectId, target: $targetId }) {
      id
      graphqlEndpointUrl
      latestSchemaVersion {
        id
        sdl
      }
    }
    ...Laboratory_IsCDNEnabledFragment
  }
`);

function LaboratoryPageContent(props: {
  organizationId: string;
  projectId: string;
  targetId: string;
}) {
  const [query] = useQuery({
    query: TargetLaboratoryPageQuery,
    variables: {
      organizationId: props.organizationId,
      projectId: props.projectId,
      targetId: props.targetId,
    },
  });
  const router = useRouter();
  const [isConnectLabModalOpen, toggleConnectLabModal] = useToggle();

  const currentOrganization = query.data?.organization?.organization;

  const operationCollectionsPlugin = useOperationCollectionsPlugin({
    canEdit: canAccessTarget(TargetAccessScope.Settings, currentOrganization?.me ?? null),
    canDelete: canAccessTarget(TargetAccessScope.Delete, currentOrganization?.me ?? null),
    organizationId: props.organizationId,
    projectId: props.projectId,
    targetId: props.targetId,
  });

  const schema = useMemo(() => {
    if (!query.data?.target?.latestSchemaVersion?.sdl) {
      return null;
    }
    return buildSchema(query.data.target.latestSchemaVersion.sdl);
  }, [query.data?.target?.latestSchemaVersion?.sdl]);

  const [actualSelectedApiEndpoint, setEndpointType] = useApiTabValueState(
    query.data?.target?.graphqlEndpointUrl ?? null,
  );

  const mockEndpoint = useMemo(() => {
    if (globalThis.window) {
      return `${location.origin}/api/lab/${props.organizationId}/${props.projectId}/${props.targetId}`;
    }

    return '';
  }, [props.organizationId, props.projectId, props.targetId]);

  const fetcher = useMemo<Fetcher>(() => {
    return async (params, opts) => {
      const fetcher = createGraphiQLFetcher({
        url:
          (actualSelectedApiEndpoint === 'linkedApi'
            ? query.data?.target?.graphqlEndpointUrl
            : undefined) ?? mockEndpoint,
        fetch,
      });

      const result = await fetcher(params, opts);

      // We only want to expose the error message, not the whole stack trace.
      if (isAsyncIterable(result)) {
        return new Repeater(async (push, stop) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          stop.then(
            () => 'return' in result && result.return instanceof Function && result.return(),
          );
          try {
            for await (const value of result) {
              await push(value);
            }
            stop();
          } catch (err: unknown) {
            const error = new Error(err instanceof Error ? err.message : 'Unexpected error.');
            Object.defineProperty(error, 'stack', {
              get() {
                return undefined;
              },
            });
            stop(error);
          }
        });
      }

      return result;
    };
  }, [query.data?.target?.graphqlEndpointUrl, actualSelectedApiEndpoint]);

  if (query.error) {
    return <QueryError organizationId={props.organizationId} error={query.error} />;
  }

  const searchObj = router.latestLocation.search;
  const operation =
    'operation' in searchObj && typeof searchObj.operation === 'string'
      ? searchObj.operation
      : null;

  return (
    <TargetLayout
      organizationId={props.organizationId}
      projectId={props.projectId}
      targetId={props.targetId}
      page={Page.Laboratory}
    >
      <div className="flex py-6">
        <div className="flex-1">
          <Title>Laboratory</Title>
          <Subtitle>Explore your GraphQL schema and run queries against your GraphQL API.</Subtitle>
          <p>
            <DocsLink className="text-muted-foreground text-sm" href="/features/laboratory">
              Learn more about the Laboratory
            </DocsLink>
          </p>
        </div>
        <div className="ml-auto mr-0 flex flex-col justify-center">
          <div>
            {query.data && !query.data.target?.graphqlEndpointUrl ? (
              <RouterLink
                to="/$organizationId/$projectId/$targetId/settings"
                params={{
                  organizationId: props.organizationId,
                  projectId: props.projectId,
                  targetId: props.targetId,
                }}
                search={{
                  page: 'general',
                }}
              >
                <Button variant="outline" className="mr-2" size="sm">
                  Connect GraphQL API Endpoint
                </Button>
              </RouterLink>
            ) : null}
            <Button onClick={toggleConnectLabModal} variant="ghost" size="sm">
              Mock Data Endpoint
            </Button>
          </div>
          <div className="self-end pt-2">
            <span className="mr-2 text-xs font-bold">Query</span>
            <ToggleGroup
              defaultValue="list"
              onValueChange={newValue => {
                setEndpointType(newValue as 'mockApi' | 'linkedApi');
              }}
              value="mock"
              type="single"
              className="bg-gray-900/50 text-gray-500"
            >
              <ToggleGroupItem
                key="mockApi"
                value="mockApi"
                title="Use Mock Schema"
                className={clsx(
                  'text-xs hover:text-white',
                  !query.fetching &&
                    actualSelectedApiEndpoint === 'mockApi' &&
                    'bg-gray-800 text-white',
                )}
                disabled={query.fetching}
              >
                Mock
              </ToggleGroupItem>
              <ToggleGroupItem
                key="linkedApi"
                value="linkedApi"
                title="Use API endpoint"
                className={cn(
                  'text-xs hover:text-white',
                  !query.fetching &&
                    actualSelectedApiEndpoint === 'linkedApi' &&
                    'bg-gray-800 text-white',
                )}
                disabled={!query.data?.target?.graphqlEndpointUrl || query.fetching}
              >
                API
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
      <Helmet>
        <style key="laboratory">{`
        .graphiql-container {
          --color-base: transparent !important;
          --color-primary: 40, 89%, 60% !important;
          min-height: 600px;
        }
        .graphiql-container .graphiql-tab-add {
          display: none;
        }
        .graphiql-container .graphiql-toolbar-icon {
          color: #4c5462;
        }

        .graphiql-container .graphiql-doc-explorer-search {
          background-color: #070d17;
        }
        .graphiql-container .cm-punctuation {
          color: #ccc;
        }
        .graphiql-container .cm-punctuation:hover {
          color: #ffffff;
        }

        .graphiql-container .graphiql-logo {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .graphiql-container .graphiql-session-header {
          display: flex;
          flex-direction: column-reverse;
          align-items: flex-start;
          height: auto;
        }

        .graphiql-container .graphiql-session-header-right {
          width: 100%;
        }

        .graphiql-container .CodeMirror-hints {
          background-color: #070d17;
        }
      `}</style>
      </Helmet>

      {query.fetching ? null : (
        <GraphiQL
          fetcher={fetcher}
          toolbar={{
            additionalContent: (
              <>
                <Save
                  organizationId={props.organizationId}
                  projectId={props.projectId}
                  targetId={props.targetId}
                />
                <Share operation={operation} />
              </>
            ),
          }}
          showPersistHeadersSettings={false}
          shouldPersistHeaders={false}
          plugins={[operationCollectionsPlugin]}
          visiblePlugin={operationCollectionsPlugin}
          schema={schema}
        >
          <GraphiQL.Logo>
            <EditorBreadcrumbs
              organizationId={props.organizationId}
              projectId={props.projectId}
              targetId={props.targetId}
            />
            <div className="ml-auto">
              <LegacyTooltip
                content={
                  actualSelectedApiEndpoint === 'linkedApi' ? (
                    <>
                      Operations are executed against{' '}
                      <span>{query.data?.target?.graphqlEndpointUrl}</span>.
                    </>
                  ) : (
                    <>Operations are executed against the mock endpoint.</>
                  )
                }
              >
                <span className="cursor-help pr-2 text-xs font-normal">
                  {actualSelectedApiEndpoint === 'linkedApi'
                    ? 'Querying GraphQL API'
                    : 'Querying Mock API'}
                </span>
              </LegacyTooltip>
              <HiveLogo className="h-6 w-auto" />
            </div>
          </GraphiQL.Logo>
        </GraphiQL>
      )}
      <ConnectLabModal
        endpoint={mockEndpoint}
        close={toggleConnectLabModal}
        isOpen={isConnectLabModalOpen}
        isCDNEnabled={query.data ?? null}
      />
    </TargetLayout>
  );
}

export function TargetLaboratoryPage(props: {
  organizationId: string;
  projectId: string;
  targetId: string;
}) {
  return (
    <>
      <Meta title="Schema laboratory" />
      <LaboratoryPageContent {...props} />
    </>
  );
}

function useApiTabValueState(graphqlEndpointUrl: string | null) {
  const [state, setState] = useResetState<'mockApi' | 'linkedApi'>(() => {
    const value = globalThis.window?.localStorage.getItem('hive:laboratory-tab-value');
    if (!value || !['mockApi', 'linkedApi'].includes(value)) {
      return graphqlEndpointUrl ? 'linkedApi' : 'mockApi';
    }

    if (value === 'linkedApi' && graphqlEndpointUrl) {
      return 'linkedApi';
    }

    return 'mockApi';
  }, [graphqlEndpointUrl]);

  return [
    state,
    useCallback(
      (state: 'mockApi' | 'linkedApi') => {
        globalThis.window?.localStorage.setItem('hive:laboratory-tab-value', state);
        setState(state);
      },
      [setState],
    ),
  ] as const;
}

function EditorBreadcrumbs(props: { organizationId: string; projectId: string; targetId: string }) {
  const router = useRouter();
  const operationId =
    'operation' in router.latestLocation.search &&
    typeof router.latestLocation.search.operation === 'string'
      ? router.latestLocation.search.operation
      : null;
  const currentOperation = useCurrentOperation(props);

  // Avoiding blinking `New Operation` when switching between operations (when current operation data is not yet fetched)
  if (operationId && (!currentOperation || currentOperation.id !== operationId)) {
    return null;
  }

  return (
    <div className="text-xs font-normal italic">
      {currentOperation?.id
        ? `${currentOperation.collection.name} > ${currentOperation.name}`
        : 'New Operation'}
    </div>
  );
}
