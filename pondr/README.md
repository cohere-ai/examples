# ponder

## GraphQL Usage

1. Visit `/api/graphql`.
2. Click **REQUEST HEADERS** and enter:

   ```json
   {
     "Authorization": "Bearer <your-api-key>"
   }
   ```

   Where `<your-api-key>` is your API key from https://os.cohere.ai/.

3. Make a GraphQL query,

   e.g. Generate:

   ```graphql
   query Generate($model: String!, $prompt: String!, $maxTokens: Int!) {
     generations(
       model: $model
       prompt: $prompt
       maxTokens: $maxTokens
       returnLikelihoods: GENERATION
     ) {
       text
       likelihood
       tokenLikelihoods {
         token
         likelihood
       }
     }
   }
   ```

   With **QUERY VARIABLES**:

   ```json
   {
     "model": "large",
     "prompt": "My name is",
     "maxTokens": 10
   }
   ```

   e.g. Classify:

   ```graphql
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
   ```

   With **QUERY VARIABLES**:

   ```json
   {
     "model": "medium",
     "examples": [
       {
         "text": "love this movie",
         "label": "positive review"
       },
       {
         "text": "I would not recommend this movie to my friends",
         "label": "negative review"
       },
       {
         "text": "I did not want to finish the movie",
         "label": "negative review"
       },
       {
         "text": "I would watch this movie again with my friends",
         "label": "positive review"
       },
       {
         "text": "hate this movie",
         "label": "negative review"
       },
       {
         "text": "this movie lacked any originality or depth",
         "label": "neutral review"
       },
       {
         "text": "we made it only a quarter way through before we stopped",
         "label": "negative review"
       },
       {
         "text": "this movie was okay",
         "label": "neutral review"
       },
       {
         "text": "this movie was neither amazing or terrible",
         "label": "neutral review"
       },
       {
         "text": "I would not watch this movie again but it was not a waste of time",
         "label": "neutral review"
       },
       {
         "text": "I would watch this movie again",
         "label": "positive review"
       },
       {
         "text": "i liked this movie",
         "label": "positive review"
       },
       {
         "text": "this movie was nothing special",
         "label": "neutral review"
       },
       {
         "text": "this is my favourite movie",
         "label": "positive review"
       },
       {
         "text": "worst movie of all time",
         "label": "negative review"
       }
     ],
     "inputs": ["this movie was great", "this movie was bad"],
     "outputIndicator": "Classify this movie review",
     "taskDescription": "Classify these movie reviews as positive reviews, negative reviews, or neutral reviews"
   }
   ```
