import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

/** Realistic text conditioned on a given input */
export type Classification = {
  __typename?: 'Classification';
  /** An array containing each class and its confidence score according to the classifier. */
  confidences: Array<ClassificationConfidence>;
  /** The input text that was classified. */
  input: Scalars['String'];
  /** The predicted class for the associated query. */
  prediction: Scalars['String'];
};

/** The confidence score for a given prediction. */
export type ClassificationConfidence = {
  __typename?: 'ClassificationConfidence';
  confidence: Scalars['Float'];
  option: Scalars['String'];
};

export type ClassifyExampleInput = {
  label: Scalars['String'];
  text: Scalars['String'];
};

/** Realistic text conditioned on a given input */
export type Generation = {
  __typename?: 'Generation';
  id: Scalars['String'];
  /** The average log-likelihood of the entire specified string. */
  likelihood?: Maybe<Scalars['Float']>;
  /** The generated text. */
  text: Scalars['String'];
  /** The log-likelihood of an individual token */
  tokenLikelihoods?: Maybe<Array<TokenLikelihood>>;
};

export type Query = {
  __typename?: 'Query';
  classify: Array<Classification>;
  generations: Array<Generation>;
};

export type QueryClassifyArgs = {
  examples: Array<ClassifyExampleInput>;
  inputs: Array<Scalars['String']>;
  model: Scalars['String'];
  outputIndicator?: InputMaybe<Scalars['String']>;
  taskDescription?: InputMaybe<Scalars['String']>;
};

export type QueryGenerationsArgs = {
  frequencyPenalty?: Scalars['Float'];
  k?: Scalars['Int'];
  maxTokens: Scalars['Int'];
  model: Scalars['String'];
  numGenerations?: Scalars['Int'];
  p?: Scalars['Float'];
  presencePenalty?: Scalars['Float'];
  prompt: Scalars['String'];
  returnLikelihoods?: ReturnLikelihoods;
  stopSequences?: InputMaybe<Array<Scalars['String']>>;
  temperature?: Scalars['Float'];
};

export enum ReturnLikelihoods {
  All = 'ALL',
  Generation = 'GENERATION',
  None = 'NONE',
}

/** The log-likelihood of an individual token */
export type TokenLikelihood = {
  __typename?: 'TokenLikelihood';
  /** The log-likelihood of the token */
  likelihood?: Maybe<Scalars['Float']>;
  /** The token */
  token: Scalars['String'];
};

export type GenerateQueryVariables = Exact<{
  model: Scalars['String'];
  prompt: Scalars['String'];
  maxTokens: Scalars['Int'];
  temperature: Scalars['Float'];
}>;

export type GenerateQuery = {
  __typename?: 'Query';
  generations: Array<{
    __typename?: 'Generation';
    text: string;
    likelihood?: number | null;
    tokenLikelihoods?: Array<{
      __typename?: 'TokenLikelihood';
      token: string;
      likelihood?: number | null;
    }> | null;
  }>;
};

export type ClassifyQueryVariables = Exact<{
  examples: Array<ClassifyExampleInput> | ClassifyExampleInput;
  inputs: Array<Scalars['String']> | Scalars['String'];
  model: Scalars['String'];
  outputIndicator?: InputMaybe<Scalars['String']>;
  taskDescription?: InputMaybe<Scalars['String']>;
}>;

export type ClassifyQuery = {
  __typename?: 'Query';
  classify: Array<{
    __typename?: 'Classification';
    input: string;
    prediction: string;
    confidences: Array<{
      __typename?: 'ClassificationConfidence';
      option: string;
      confidence: number;
    }>;
  }>;
};

export const GenerateDocument = gql`
  query Generate($model: String!, $prompt: String!, $maxTokens: Int!, $temperature: Float!) {
    generations(
      model: $model
      prompt: $prompt
      maxTokens: $maxTokens
      returnLikelihoods: GENERATION
      temperature: $temperature
    ) {
      text
      likelihood
      tokenLikelihoods {
        token
        likelihood
      }
    }
  }
`;

export function useGenerateQuery(
  options: Omit<Urql.UseQueryArgs<GenerateQueryVariables>, 'query'>,
) {
  return Urql.useQuery<GenerateQuery, GenerateQueryVariables>({
    query: GenerateDocument,
    ...options,
  });
}
export const ClassifyDocument = gql`
  query Classify(
    $examples: [ClassifyExampleInput!]!
    $inputs: [String!]!
    $model: String!
    $outputIndicator: String
    $taskDescription: String
  ) {
    classify(
      examples: $examples
      inputs: $inputs
      model: $model
      outputIndicator: $outputIndicator
      taskDescription: $taskDescription
    ) {
      input
      prediction
      confidences {
        option
        confidence
      }
    }
  }
`;

export function useClassifyQuery(
  options: Omit<Urql.UseQueryArgs<ClassifyQueryVariables>, 'query'>,
) {
  return Urql.useQuery<ClassifyQuery, ClassifyQueryVariables>({
    query: ClassifyDocument,
    ...options,
  });
}
import { IntrospectionQuery } from 'graphql';
export default {
  __schema: {
    queryType: {
      name: 'Query',
    },
    mutationType: null,
    subscriptionType: null,
    types: [
      {
        kind: 'OBJECT',
        name: 'Classification',
        fields: [
          {
            name: 'confidences',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'OBJECT',
                    name: 'ClassificationConfidence',
                    ofType: null,
                  },
                },
              },
            },
            args: [],
          },
          {
            name: 'input',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
          {
            name: 'prediction',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'ClassificationConfidence',
        fields: [
          {
            name: 'confidence',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
          {
            name: 'option',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'Generation',
        fields: [
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
          {
            name: 'likelihood',
            type: {
              kind: 'SCALAR',
              name: 'Any',
            },
            args: [],
          },
          {
            name: 'text',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
          {
            name: 'tokenLikelihoods',
            type: {
              kind: 'LIST',
              ofType: {
                kind: 'NON_NULL',
                ofType: {
                  kind: 'OBJECT',
                  name: 'TokenLikelihood',
                  ofType: null,
                },
              },
            },
            args: [],
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'Query',
        fields: [
          {
            name: 'classify',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'OBJECT',
                    name: 'Classification',
                    ofType: null,
                  },
                },
              },
            },
            args: [
              {
                name: 'examples',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'LIST',
                    ofType: {
                      kind: 'NON_NULL',
                      ofType: {
                        kind: 'SCALAR',
                        name: 'Any',
                      },
                    },
                  },
                },
              },
              {
                name: 'inputs',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'LIST',
                    ofType: {
                      kind: 'NON_NULL',
                      ofType: {
                        kind: 'SCALAR',
                        name: 'Any',
                      },
                    },
                  },
                },
              },
              {
                name: 'model',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'outputIndicator',
                type: {
                  kind: 'SCALAR',
                  name: 'Any',
                },
              },
              {
                name: 'taskDescription',
                type: {
                  kind: 'SCALAR',
                  name: 'Any',
                },
              },
            ],
          },
          {
            name: 'generations',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'LIST',
                ofType: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'OBJECT',
                    name: 'Generation',
                    ofType: null,
                  },
                },
              },
            },
            args: [
              {
                name: 'frequencyPenalty',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'k',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'maxTokens',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'model',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'numGenerations',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'p',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'presencePenalty',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'prompt',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'returnLikelihoods',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
              {
                name: 'stopSequences',
                type: {
                  kind: 'LIST',
                  ofType: {
                    kind: 'NON_NULL',
                    ofType: {
                      kind: 'SCALAR',
                      name: 'Any',
                    },
                  },
                },
              },
              {
                name: 'temperature',
                type: {
                  kind: 'NON_NULL',
                  ofType: {
                    kind: 'SCALAR',
                    name: 'Any',
                  },
                },
              },
            ],
          },
        ],
        interfaces: [],
      },
      {
        kind: 'OBJECT',
        name: 'TokenLikelihood',
        fields: [
          {
            name: 'likelihood',
            type: {
              kind: 'SCALAR',
              name: 'Any',
            },
            args: [],
          },
          {
            name: 'token',
            type: {
              kind: 'NON_NULL',
              ofType: {
                kind: 'SCALAR',
                name: 'Any',
              },
            },
            args: [],
          },
        ],
        interfaces: [],
      },
      {
        kind: 'SCALAR',
        name: 'Any',
      },
    ],
    directives: [],
  },
} as unknown as IntrospectionQuery;
