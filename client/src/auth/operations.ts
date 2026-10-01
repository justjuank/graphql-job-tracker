import { graphql } from '../gql'

export const LOGIN_MUTATION = graphql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        role
      }
    }
  }
`)

export const REGISTER_MUTATION = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        role
      }
    }
  }
`)
