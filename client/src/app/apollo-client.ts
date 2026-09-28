import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

import { getAccessToken } from '../auth/token-storage'

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
})

const authenticationLink = new SetContextLink((previousContext) => {
  const token = getAccessToken()

  return {
    headers: {
      ...previousContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authenticationLink, httpLink]),
  cache: new InMemoryCache(),
})
