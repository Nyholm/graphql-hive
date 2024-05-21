import { type IncomingMessage } from 'node:http';
import nock from 'nock';
import { beforeEach, expect, test } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { useHive } from '../src';

beforeEach(() => {
  nock.cleanAll();
});

type ApolloServerContext = {
  req: IncomingMessage;
};

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

  const testServer = new ApolloServer({
    typeDefs: /* GraphQL */ `
      type Query {
        hi: String
      }
    `,
    plugins: [
      useHive({
        token: 'token',
        persistedDocuments: {
          endpoint: 'http://artifatcs-cdn.localhost',
          accessToken: 'foo',
        },
      }),
    ],
  });
  const { url } = await startStandaloneServer(testServer, {
    async context({ req }): Promise<ApolloServerContext> {
      return { req };
    },
  });
  const response = await fetch(url, {
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
