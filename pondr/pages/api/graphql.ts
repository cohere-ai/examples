// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServer, GraphQLYogaError } from '@graphql-yoga/node';
import SchemaBuilder from '@pothos/core';
import cohere from 'cohere-ai';
import type { NextApiRequest, NextApiResponse } from 'next';

const builder = new SchemaBuilder<{
  Context: {
    cohere: typeof cohere;
  };
}>({});

/**
 * Generate
 */

interface TokenLikelihoodShape {
  token: string;
  likelihood?: number;
}

const TokenLikelihood = builder.objectRef<TokenLikelihoodShape>('TokenLikelihood');

interface GenerationShape {
  id: string;
  text: string;
  likelihood?: number;
  token_likelihoods?: TokenLikelihoodShape[];
}

const Generation = builder.objectRef<GenerationShape>('Generation');

builder.objectType(Generation, {
  description: 'Realistic text conditioned on a given input',
  fields: (t) => ({
    id: t.string({
      resolve: (parent) => parent.id,
    }),
    text: t.string({
      description: 'The generated text.',
      resolve: (parent) => parent.text,
    }),
    likelihood: t.float({
      description: 'The average log-likelihood of the entire specified string.',
      nullable: true,
      resolve: (parent) => parent.likelihood,
    }),
    tokenLikelihoods: t.field({
      type: [TokenLikelihood],
      description: 'The log-likelihood of an individual token',
      nullable: true,
      resolve: (parent) => parent.token_likelihoods,
    }),
  }),
});

builder.objectType(TokenLikelihood, {
  description: 'The log-likelihood of an individual token',
  fields: (t) => ({
    token: t.string({
      description: 'The token',
      resolve: (parent) => parent.token,
    }),
    likelihood: t.float({
      description: 'The log-likelihood of the token',
      nullable: true,
      resolve: (parent) => parent.likelihood,
    }),
  }),
});

enum ReturnLikelihoods {
  GENERATION = 'GENERATION',
  ALL = 'ALL',
  NONE = 'NONE',
}

builder.enumType(ReturnLikelihoods, {
  name: 'ReturnLikelihoods',
});

/**
 * Classify
 */

interface ClassificationConfidenceShape {
  option: string;
  confidence: number;
}

const ClassificationConfidence = builder.objectRef<ClassificationConfidenceShape>(
  'ClassificationConfidence',
);

interface ClassificationShape {
  // id: string;
  input: string;
  prediction: string;
  confidences: ClassificationConfidenceShape[];
}

const Classification = builder.objectRef<ClassificationShape>('Classification');

builder.objectType(Classification, {
  description: 'Realistic text conditioned on a given input',
  fields: (t) => ({
    // id: t.string({
    //   resolve: (parent) => parent.id,
    // }),
    input: t.string({
      description: 'The input text that was classified.',
      resolve: (parent) => parent.input,
    }),
    prediction: t.string({
      description: 'The predicted class for the associated query.',
      resolve: (parent) => parent.prediction,
    }),
    confidences: t.field({
      type: [ClassificationConfidence],
      description:
        'An array containing each class and its confidence score according to the classifier.',
      resolve: (parent) => parent.confidences,
    }),
  }),
});

builder.objectType(ClassificationConfidence, {
  description: 'The confidence score for a given prediction.',
  fields: (t) => ({
    option: t.string({
      resolve: (parent) => parent.option,
    }),
    confidence: t.float({
      resolve: (parent) => parent.confidence,
    }),
  }),
});

const ClassifyExampleInput = builder.inputType('ClassifyExampleInput', {
  fields: (t) => ({
    text: t.string({ required: true }),
    label: t.string({ required: true }),
  }),
});

/**
 * Root query type
 */
builder.queryType({
  fields: (t) => ({
    generations: t.field({
      args: {
        model: t.arg.string({
          description: 'The model to query, e,g. large',
          required: true,
        }),
        prompt: t.arg.string({
          description:
            'Represents the prompt or text to be completed. Trailing whitespaces will be trimmed.',
          required: true,
        }),
        maxTokens: t.arg.int({
          description: 'Denotes the number of tokens to predict per generation.',
          required: true,
        }),
        temperature: t.arg.float({
          description:
            'Defaults to 1.0, min value of 0.0, max value of 5.0. A non-negative float that tunes ' +
            'the degree of randomness in generation. Lower temperatures mean less random generations.',
          required: true,
          defaultValue: 1,
        }),
        numGenerations: t.arg.int({
          description:
            'Defaults to 1, max value of 5. Denotes the maximum number of generations that will be returned.',
          required: true,
          defaultValue: 1,
        }),
        k: t.arg.int({
          description:
            'Defaults to 0 (disabled), which is the minimum. Maximum value is 500. Ensures only the ' +
            'top k most likely tokens are considered for generation at each step.',
          required: true,
          defaultValue: 0,
        }),
        p: t.arg.float({
          description:
            'Defaults to 0.75. Set to 1.0 or 0 to disable. If set to a probability 0.0 < p < 1.0, ' +
            'it ensures that only the most likely tokens, with total probability mass of p, are considered ' +
            'for generation at each step. If both k and p are enabled, p acts after k.',
          required: true,
          defaultValue: 0.75,
        }),
        frequencyPenalty: t.arg.float({
          description:
            'Defaults to 0.0, max value of 1.0. Can be used to reduce repetitiveness of generated tokens. ' +
            'The higher the value, the stronger a penalty is applied to previously present tokens, ' +
            'proportional to how many times they have already appeared in the prompt or prior generation. ' +
            'Cannot be used with xlarge model.',
          required: true,
          defaultValue: 0,
        }),
        presencePenalty: t.arg.float({
          description:
            'Defaults to 0.0, max value of 1.0. Can be used to reduce repetitiveness of ' +
            'generated tokens. Similar to frequency_penalty, except that this penalty is applied ' +
            'equally to all tokens that have already appeared, regardless of their exact frequencies. ' +
            'Cannot be used with xlarge model.',
          required: true,
          defaultValue: 0,
        }),
        stopSequences: t.arg.stringList({
          description:
            'A stop sequence will cut off your generation at the end of the sequence. ' +
            'Providing multiple stop sequences in the array will cut the generation at the first ' +
            'stop sequence in the generation, if applicable.',
          required: false,
        }),
        returnLikelihoods: t.arg({
          description:
            'One of GENERATION|ALL|NONE to specify how and if the token likelihoods are returned with ' +
            'the response. Defaults to NONE. If GENERATION is selected, the token likelihoods will only ' +
            'be provided for generated text. If ALL is selected, the token likelihoods will be provided ' +
            'both for the prompt and the generated text.',
          type: ReturnLikelihoods,
          required: true,
          defaultValue: ReturnLikelihoods.NONE,
        }),
      },
      type: [Generation],
      resolve: async (_parent, args, context) => {
        const { cohere } = context;
        const generations = await cohere.generate({
          model: args.model,
          prompt: args.prompt,
          max_tokens: args.maxTokens,
          temperature: args.temperature,
          num_generations: args.numGenerations,
          k: args.k,
          p: args.p,
          frequency_penalty: args.frequencyPenalty,
          presence_penalty: args.presencePenalty,
          return_likelihoods: args.returnLikelihoods,
          ...(args.stopSequences && {
            stop_sequences: args.stopSequences,
          }),
        });
        return generations.body['generations'];
      },
    }),
    classify: t.field({
      args: {
        model: t.arg.string({
          description:
            'The size of model to generate with, currently available models are `small`, `medium`, defaults to `medium`. Small models are faster, while larger models will perform better. Finetuned models can also be supplied with their full ID.',
          required: true,
        }),
        outputIndicator: t.arg.string({
          description:
            'The output indicator part of the prompt. This is string to be appended at the end of every example and text. See Prompt Engineering for more details.',
          required: false,
        }),
        taskDescription: t.arg.string({
          description:
            'A brief description providing context on the type classification the model should preform (i.e. "Classify these movie reviews as positive reviews or negative reviews").',
          required: false,
        }),
        inputs: t.arg.stringList({
          description:
            'Represents a list of queries to be classified, each entry must not be empty. The maximum is 32 inputs.',
          required: true,
        }),
        examples: t.arg({
          description:
            'An array of examples to provide context to the model. Each example is a text string and its label/class. Each unique label/class requires at least 5 examples associated with it, there is a maximum of 50 total examples.',
          type: [ClassifyExampleInput],
          required: true,
        }),
      },
      type: [Classification],
      resolve: async (_parent, args, context) => {
        const { cohere } = context;
        const classifications = await cohere.classify({
          model: args.model,
          inputs: args.inputs,
          examples: args.examples,
          ...(args.outputIndicator && {
            stop_sequences: args.outputIndicator,
          }),
          ...(args.taskDescription && {
            stop_sequences: args.taskDescription,
          }),
        });
        return classifications.body['classifications'];
      },
    }),
  }),
});

export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
};

export default createServer<{
  req: NextApiRequest;
  res: NextApiResponse;
}>({
  graphiql: {
    endpoint: '/api/graphql',
  },
  schema: builder.toSchema({}),
  context: async ({}) => {
    // const authorization = request.headers.get('authorization');
    // if (!authorization || !authorization.startsWith('Bearer ')) {
    //   throw new GraphQLYogaError('Authorization header is required');
    // }
    if (!process.env.COHERE_API_KEY) {
      throw new GraphQLYogaError('COHERE_API_KEY is required');
    }
    cohere.init(process.env.COHERE_API_KEY);
    return { cohere };
  },
  cors: {
    origin: ['*'],
    credentials: true,
    methods: ['POST'],
  },
  maskedErrors: false,
});
