import type { CodegenConfig } from '@graphql-codegen/cli'
import { buildSchema } from 'graphql'

import { typeDefs } from '../src/schema.ts'

const config: CodegenConfig = {
  schema: buildSchema(typeDefs),
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  generates: {
    './src/gql/': {
      preset: 'client',
      config: {
        scalars: {
          DateTime: 'string',
        },
        useTypeImports: true,
      },
    },
  },
}

export default config
