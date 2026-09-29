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

export const UPDATE_APPLICATION_STATUS_MUTATION = graphql(`
  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {
    updateApplicationStatus(id: $id, status: $status) {
      __typename
      id
      status
    }
  }
`)

export const APPLICATION_DETAIL_QUERY = graphql(`
  query ApplicationDetail($id: ID!) {
    application(id: $id) {
      id
      role
      status
      createdAt
      company {
        id
        name
      }
      interviews {
        id
        type
        scheduledAt
      }
    }
  }
`)

export const UPDATE_APPLICATION_MUTATION = graphql(`
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      application {
        id
        role
        status
        company {
          id
          name
        }
      }
    }
  }
`)

export const ADD_INTERVIEW_MUTATION = graphql(`
  mutation AddInterview($input: AddInterviewInput!) {
    addInterview(input: $input) {
      id
      type
      scheduledAt
      application {
        id
      }
    }
  }
`)

export const DELETE_APPLICATION_MUTATION = graphql(`
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id) {
      deletedApplicationId
      deletedInterviewCount
    }
  }
`)
