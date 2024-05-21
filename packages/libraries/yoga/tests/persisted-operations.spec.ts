import { createSchema, createYoga } from 'graphql-yoga';
import nock from 'nock';
import { beforeAll, expect, test } from 'vitest';
import { useHive } from '@graphql-hive/yoga';

beforeAll(() => {
  nock.cleanAll();
});

test('use persisted operations (GraphQL over HTTP "documentId")', async () => {
  const httpScope = nock('http://artifatcs-cdn.localhost', {
    reqheaders: {
      'X-Hive-CDN-Key': value => {
        expect(value).toBe('foo');
        return true;
      },
    },
  })
    .get('/client-name/client-version/hash')
    .reply(200, 'query { hi }');

  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String
        }
      `,
    }),
    plugins: [
      useHive({
        enabled: false,
        persistedDocuments: {
          endpoint: 'http://artifatcs-cdn.localhost',
          accessToken: 'foo',
        },
      }),
    ],
  });

  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId: 'client-name/client-version/hash',
    }),
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: { hi: null } });

  httpScope.done();
});

test('use persisted operations (GraphQL REST)', async () => {
  const httpScope = nock('http://artifatcs-cdn.localhost', {
    reqheaders: {
      'X-Hive-CDN-Key': value => {
        expect(value).toBe('foo');
        return true;
      },
    },
  })
    .get('/client-name/client-version/hash')
    .reply(200, 'query { hi }');

  const yoga = createYoga({
    graphqlEndpoint: '/graphql/*?',
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String
        }
      `,
    }),
    plugins: [
      useHive({
        enabled: false,
        persistedDocuments: {
          endpoint: 'http://artifatcs-cdn.localhost',
          accessToken: 'foo',
        },
      }),
    ],
  });

  const response = await yoga.fetch('http://localhost/graphql/client-name/client-version/hash', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: { hi: null } });

  httpScope.done();
});
