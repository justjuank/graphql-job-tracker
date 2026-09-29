import { graphql } from '../gql'

export const DASHBOARD_QUERY = graphql(`
  query Dashboard(
    $first: Int!
    $after: String
    $filter: ApplicationFilter
  ) {
    me {
      id
      email
      role
      applications {
        id
        status
      }
    }
    applicationPage(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          role
          status
          createdAt
          company {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`)

export const CREATE_APPLICATION_MUTATION = graphql(`
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      role
      status
      createdAt
      company {
        id
        name
      }
    }
  }
`)
