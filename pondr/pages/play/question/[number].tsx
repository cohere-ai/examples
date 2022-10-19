import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { Layout } from '../../../components';
import { useCohereQuestion } from '../../../components/useCohereQuestion';
import { Relationship } from '../describe-relationship';

interface Props {}

const QuestionPage: React.FC<Props> = () => {
  const router = useRouter();
  const questionNumber = Number.parseInt(router.query.number as string, 10);
  const depth = Number.parseInt(router.query.depth as string, 10);
  const relationship = router.query.relationship as string;
  const setting = router.query.setting as string;
  const model = router.query.model as string | undefined;

  const { question, error } = useCohereQuestion(
    { relationship: relationship as Relationship, setting, depth, model },
    [questionNumber],
  );

  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => {
    setIsFlipped(false);
  }, [questionNumber]);

  const isOddQuestion = questionNumber % 2 === 1;
  const player1 = router.query.player1;
  const player2 = router.query.player2;
  const asker = isOddQuestion ? player1 : player2;
  const answerer = isOddQuestion ? player2 : player1;

  const answererAlreadyFlipped = Boolean(
    isOddQuestion ? router.query.player2Flipped === 'true' : router.query.player1Flipped === 'true',
  );

  const getNextHref = ({ isFlipped }: { isFlipped: boolean }) => {
    if (isOddQuestion) {
      return {
        pathname: '/play/question/[number]',
        query: {
          number: questionNumber + 1,
          player1: router.query.player1,
          player2: router.query.player2,
          relationship,
          setting,
          depth: router.query.depth,
          model: router.query.model,
          player1Flipped: router.query.player1Flipped,
          player2Flipped: router.query.player2Flipped === 'true' || isFlipped ? 'true' : 'false',
        },
      };
    } else {
      return {
        pathname: '/play/question/deeper',
        query: {
          number: questionNumber,
          player1: router.query.player1,
          player2: router.query.player2,
          relationship,
          setting,
          depth: router.query.depth,
          model: router.query.model,
          player1Flipped: router.query.player1Flipped === 'true' || isFlipped ? 'true' : 'false',
          player2Flipped: router.query.player2Flipped,
        },
      };
    }
  };

  const handleFlipQuestion = () => {
    setIsFlipped(true);
  };

  if (error) return <p>Oh no... {JSON.stringify(error)}</p>;

  return (
    <Layout className="bg-purple text-white">
      <h1 className="text-3xl pb-8">
        {asker} is {isFlipped ? 'answering' : 'asking'}
      </h1>
      <div className="w-full p-2 rounded-lg bg-white text-dark-purple flex flex-col items-center">
        <h2 className="text-lg">Question {questionNumber}</h2>
        <p className="text-5xl text-center py-8">{question || 'Loading question...'}</p>
      </div>
      {isFlipped ? (
        <h1 className="text-3xl mt-3 text-center">{answerer} has flipped the question</h1>
      ) : (
        <>
          <h1 className="text-3xl mt-3 text-center">{answerer} is answering</h1>
          {!answererAlreadyFlipped && (
            <button
              className="mt-3 block px-3 rounded-full border-white border-2 border-solid"
              onClick={handleFlipQuestion}
            >
              Flip question
            </button>
          )}
        </>
      )}
      <Link href={getNextHref({ isFlipped })}>
        <a className="mt-3 py-3 px-12 text-xl bg-white rounded-full text-purple">Next</a>
      </Link>
    </Layout>
  );
};

export default QuestionPage;
