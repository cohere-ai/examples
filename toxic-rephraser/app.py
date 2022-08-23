import streamlit as st
import numpy as np
import pandas as pd
import re
import cohere
import os
from sklearn.metrics.pairwise import cosine_similarity

api_key = os.environ["CO_KEY"] # add the api key to the environment
co = cohere.Client(api_key)

# Perform classification - Finetune option
def classify_text(text):
  classifications = co.classify(
    model='cohere-toxicity',
    inputs=[text],
    )
  # return classifications.classifications[0].prediction
  return classifications.classifications[0].prediction, \
    classifications.classifications[0].confidence[1].confidence

prompt = "This program rewrites a toxic comment into a civil and polite comment with a similar meaning.\n\n--\nToxic comment: stop being ignorant and lazy and try reading a bit about it.\nPolite comment: try reading and be a little more informed about it before you try to make a comment.\n\n--\nToxic comment: this is the most idiotic post ever.\nPolite comment: this doesn\'t make sense to me at all. \n\n--\nToxic comment: why don\'t you use your brain before posting this.\nPolite comment: did you first think before posting this.\n\n--\nToxic comment: this is the stupidest thing I\'ve ever read.\nPolite comment: I disagree with what you are saying here.\n\n--\nToxic comment: why the f*ck are you saying this?\nPolite comment: you should not have said this\n\n--\nToxic comment: stop being a moron.\nPolite comment: please stop behaving this way.\n\n--\nToxic comment: are you crazy? this is nonsensical.\nPolite comment: this makes no sense.\n\n--\nToxic comment: are you freaking kidding me?\nPolite comment: did you just say that?\n\n--\nToxic comment: I can\'t believe someone with this much intelligence posted this.\nPolite comment: I can\'t believe you are saying this.\n\n--\nToxic comment: I will honestly kill you.\nPolite comment: I can\'t stand this anymore.\n\n--\nToxic comment: f*ck you with your stupid comments.\nPolite comment: stop saying that.\n\n--\nToxic comment: you should be ashamed of yourself for making such a dumb comment.\nPolite comment: I can\'t believe you are making this kind of comment.\n\n--\nToxic comment: stop being such a rude a*sehole.\nPolite comment: you need to learn to behave a bit.\n\n--\nToxic comment: you can\'t do anything right.\nPolite comment: that\'s not a right thing to do.\n\n--\nToxic comment: are you blind?\nPolite comment: did you not notice?\n\n--\nToxic comment: you are an idiot.\nPolite comment: you don\'t know what you are doing.\n\n--\nToxic comment: you\'re a noob.\nPolite comment: you are new here.\n\n--\nToxic comment: you can\'t even spell it right.\nPolite comment: you have made a typo.\n\n--\nToxic comment: what\'s wrong with you?\nPolite comment: I\'m sorry but I don\'t agree with you.\n\n--\nToxic comment: stop being so mean to everyone.\nPolite comment: I understand you have a problem but please don\'t take it out on others.\n\n--\nToxic comment:"

# Rephrase a toxic comment
def rephrase(toxic_comment):
  prediction = co.generate(
    model='xlarge',
    prompt=prompt + toxic_comment,
    max_tokens=50,
    temperature=0.8,
    k=0,
    p=0.8,
    frequency_penalty=0,
    presence_penalty=0,
    stop_sequences=["--"],
    return_likelihoods='NONE')
  return prediction.generations[0].text

# Get embeddings of a text
def get_embeddings(text,model='small'):
  output = co.embed(
                model=model,
                texts=[text],
                truncate="LEFT")
  return output.embeddings[0]

# Get a list of bad words
with open('bad-words.txt') as file:
  # content = file.readlines().strip()
  bad_words = file.read().splitlines()


# Rephrase a toxic comment and keep doing until all conditions met - similarity, toxicity, no bad words 

SIMILARITY_THRES = 0.4

def generate_new(toxic_comment):

  # Keep a record of all rephrase attempts
  attempts = []

  repeat = True
  while repeat:
    # Rephrase text
    rephrased = rephrase(toxic_comment)

    # Cleanup rephrased text
    rephrased = rephrased.replace("\nPolite comment:","").replace("\n\n--","").strip('.')
    rephrased = re.sub("^[^a-zA-Z0-9]+", "",rephrased)

    # Embed the original and rephrased text
    emb_toxic_comment = np.expand_dims(np.array(get_embeddings(toxic_comment)), axis=0)
    emb_rephrased = np.expand_dims(np.array(get_embeddings(rephrased)), axis=0)
    # Check similarity between the original and rephrased text
    similarity = cosine_similarity(emb_toxic_comment,emb_rephrased)[0][0]
    similar_check = similarity > SIMILARITY_THRES
    if similar_check:

      # Check if rephrased text is toxic
      toxic_check = classify_text(rephrased)[0]
      if toxic_check == 'Not Toxic':

        # Check if rephrased text contains bad words
        bad_word_check = [b for b in bad_words if(b in rephrased)]
        bad_word_check = bool(bad_word_check)
        if bad_word_check == False:
          repeat = False

    attempts.append(rephrased)

  return rephrased, attempts


# The user interface

st.header("Toxic Comment Rephraser")

st.subheader("Add a Comment")
user_input = st.text_input("", "...")

check_toxic = classify_text(user_input)[0]
if check_toxic == 'Not Toxic':
    st.text("<Not Toxic>")
else:
    rephrased, attempts = generate_new(user_input)
    final_output = "Did you mean...\n" + rephrased

    st.subheader(final_output)

    st.markdown("""---""")

    # Show all the rephrase attempts
    st.subheader("Rephrase attempts")
    for id, attempt in enumerate(attempts):
        resp = "#" + str(id+1) + ": " + attempt
        st.text(resp)


