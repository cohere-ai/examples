import cohere from 'cohere-ai';
import maxBy from 'lodash/maxBy';
import type { NextApiRequest, NextApiResponse } from 'next';

if (!process.env.COHERE_API_KEY) {
  throw new Error('COHERE_API_KEY is required');
}
cohere.init(process.env.COHERE_API_KEY);

const INTERESTINGNESS_EXAMPLES = [
  {
    text: 'What do you think is the hardest part of what I do for a living?',
    label: 'Not Interesting',
  },
  {
    text: "What's the first thing you noticed about me?",
    label: 'Interesting',
  },
  {
    text: 'Do you think plants thrive or die in my care?',
    label: 'Interesting',
  },
  {
    text: 'Do I seem like more of a creative or analytical type?',
    label: 'Interesting',
  },
  {
    text: 'What subject do you think I thrived at in school?',
    label: 'Not Interesting',
  },
  {
    text: "What's been your happiest memory this past year?",
    label: 'Interesting',
  },
  {
    text: 'What lesson took you the longest to un-learn?',
    label: 'Not Interesting',
  },
  {
    text: 'How can you become a better person?',
    label: 'Not Interesting',
  },
  {
    text: 'Do you think I intimidate others? Why or why not?',
    label: 'Interesting',
  },
  {
    text: "What's the most embarrassing thing that happened to you on a date?",
    label: 'Not Interesting',
  },
  {
    text: 'How would you describe what you think my type is in three words?',
    label: 'Interesting',
  },
  {
    text: "What do you think I'm most likely to splurge on?",
    label: 'Interesting',
  },
  {
    text: 'As a child what do you think I wanted to be when I grow up?',
    label: 'Interesting',
  },
  {
    text: 'Do you think you are usually early, on time, or late to events?',
    label: 'Not Interesting',
  },
  {
    text: 'Do you think I was popular at school?',
    label: 'Interesting',
  },
  {
    text: 'What questions are you trying to answer most in your life right now?',
    label: 'Not Interesting',
  },
];

const SPECIFICITY_EXAMPLES = [
  {
    text: "What's the first thing you noticed about me?",
    label: 'Specific',
  },
  {
    text: 'Do you think plants thrive or die in my care?',
    label: 'Specific',
  },
  {
    text: 'Do I seem like more of a creative or analytical type?',
    label: 'Not Specific',
  },
  {
    text: 'How would you describe what you think my type is in three words?',
    label: 'Not Specific',
  },
  {
    text: "What do you think I'm most likely to splurge on?",
    label: 'Specific',
  },
  {
    text: 'What subject do you think I thrived at in school?',
    label: 'Not Specific',
  },
  {
    text: 'As a child what do you think I wanted to be when I grow up?',
    label: 'Specific',
  },
  {
    text: 'Do you think I was popular at school?',
    label: 'Specific',
  },
  {
    text: "Do you think you're usually early, on time, or late to events?",
    label: 'Specific',
  },
  {
    text: 'Do you think I intimidate others? Why or why not?',
    label: 'Specific',
  },
  {
    text: "What's been your happiest memory this past year?",
    label: 'Not Specific',
  },
  {
    text: 'What subject do you think I thrived at in school?',
    label: 'Specific',
  },
  {
    text: "What's the biggest mistake that you think you needed to make to become who you are now?",
    label: 'Specific',
  },
  {
    text: "Is there anything you've done recently that you're incredibly proud of?",
    label: 'Not Specific',
  },
  {
    text: 'How are you and your siblings similar?',
    label: 'Not Specific',
  },
  {
    text: "What's the worst pain you have ever been in that wasn't physical?",
    label: 'Specific',
  },
  {
    text: 'Has a stranger ever changed your life?',
    label: 'Specific',
  },
  {
    text: 'Do you think the image you have of yourself matches the image other people see you as?',
    label: 'Specific',
  },
  {
    text: 'What would your younger self not believe about your life today?',
    label: 'Specific',
  },
];

/**
 * Parse the first 5 questions from the generation.
 */
const parseFiveQuestionsFromGeneration = (generations: { text: string }[]) => {
  if (generations.length === 0) {
    console.warn('No generations produced.');
    return [];
  }
  const generation = generations[0];
  const questions = generation.text.split('\n').map((question) => {
    const found = question.match(/ (.*)/);
    if (found) {
      return found[1];
    }
    console.warn(`Could not find question in "${question}".`);
    return '';
  });
  return questions.slice(0, 10);
};

type QuestionWithMetadata = [
  string,
  { interestingness: number; specificity: number; score: number },
];

type Classification = {
  input: string;
  prediction: string;
  confidences: { option: string; confidence: number }[];
};

/**
 * Get an optimal question from the generation by finding the question with
 * maximum average interestingness and specificity.
 */
const getQuestion = (
  questions: string[],
  classificationsInterestingness: Classification[],
  classificationsSpecificity: Classification[],
) => {
  if (questions.length === 0) return '';

  const questionsMetadata: QuestionWithMetadata[] = questions.map((question) => {
    const interestingnessConfidence = classificationsInterestingness.find(
      (classification) => classification.input === question,
    )?.confidences[1].confidence!;
    const specificityConfidence = classificationsSpecificity.find(
      (classification) => classification.input === question,
    )?.confidences[1].confidence!;
    return [
      question,
      {
        interestingness: interestingnessConfidence,
        specificity: specificityConfidence,
        score: (3 * interestingnessConfidence + specificityConfidence) / 2,
      },
    ];
  });

  console.info('Selecting top question from', questionsMetadata);

  // Select by score of interestingness + specificity
  const [topQuestion, _topQuestionMetadata] = maxBy<QuestionWithMetadata>(
    questionsMetadata,
    ([_question, metadata]) => metadata.score,
  )!;

  return topQuestion;
};

const generateQuestion = async (req: NextApiRequest, res: NextApiResponse) => {
  const { relationship, setting, depth, model } = req.body;

  let relationshipContext = '';
  if (relationship === 'coworkers') {
    relationshipContext = 'I am meeting up with a coworker.';
  } else if (relationship === 'friendship') {
    relationshipContext = 'I am meeting up with a friend.';
  } else if (relationship === 'romance') {
    relationshipContext = 'I am meeting up with a lover.';
  } else {
    // strangers
    relationshipContext = 'I am meeting up with a stranger.';
  }

  let depthContext = 'These questions should be very deep, but not about death.';
  if (depth === 0) {
    depthContext = 'These questions should not be deep.';
  } else if (depth === 1) {
    depthContext = 'These questions should be somewhat deep.';
  } else {
    // deepest
  }

  const generations = await cohere.generate({
    model: model || 'xlarge',
    prompt:
      `${relationshipContext} ${setting}. I want to ask some interesting questions. ${depthContext}\n` +
      'Here are 10 interesting questions to ask:\n1)',
    max_tokens: 150,
    temperature: 1,
  });

  const fiveQuestions = parseFiveQuestionsFromGeneration(generations.body['generations']);

  const classificationsInterestingness = await cohere.classify({
    model: 'medium',
    examples: INTERESTINGNESS_EXAMPLES,
    inputs: fiveQuestions,
  });
  const classificationsSpecificity = await cohere.classify({
    model: 'medium',
    examples: SPECIFICITY_EXAMPLES,
    inputs: fiveQuestions,
  });

  const question = getQuestion(
    fiveQuestions,
    classificationsInterestingness.body['classifications'],
    classificationsSpecificity.body['classifications'],
  );

  res.status(200).json({ question });
};

export default generateQuestion;
