# Copyright (c) 2023 Cohere Inc. and its affiliates.
#
# Licensed under the MIT License (the "License");
# you may not use this file except in compliance with the License.
#
# You may obtain a copy of the License in the LICENSE file at the top
# level of this repository.

import numpy as np
import pandas as pd
import recommender as rec
import streamlit as st

st.set_page_config(layout="wide")


# Load the dataset to a dataframe
@st.cache
def load_df(csv_file):
    return pd.read_csv(csv_file, delimiter=",")


df = load_df("bbc_news_test.csv")
articles = df["news"].tolist()
titles = df["title"].tolist()

# Get embeddings

# Option 1 - Use this to load from pre-generated embeddings
embs = np.load("embeddings_bbc.npy")

# # Option 2 - Use this to generate new embeddings
# embeddings = rec.embed_text(articles)

# Title
st.header("Article Recommender")

# Drop down selectbox
col1, col2 = st.columns(2)
with col1:
    current_id = st.selectbox("Select an Article", range(len(titles)), format_func=lambda x: titles[x])
    st.markdown("[Source](http://mlg.ucd.ie/datasets/bbc.html)")

# Get the similarity between the target and candidate articles
current_emb = embs[current_id]
similarity_scores = rec.get_similarity(current_emb, embs)

col3, col4 = st.columns(2)

# Current article
with col3:
    st.markdown("***You are currently reading...***")
    current_class = rec.classify_text(articles[current_id])
    st.markdown(f"###### {current_class.capitalize()}")
    st.subheader(f"{titles[current_id]}")
    current_article = articles[current_id]
    st.write(current_article.replace("$", "\\$"))

# Recommended article
with col4:
    st.markdown("***You might also like...***")
    SHOW_TOP = 3
    count = 0
    for candidate_id, _ in similarity_scores:
        candidate_article = articles[candidate_id]
        candidate_title = titles[candidate_id]

        candidate_class = rec.classify_text(candidate_article)

        if candidate_class == current_class and candidate_id != current_id:
            # Show title
            st.markdown(f"###### {candidate_class.capitalize()}")
            st.subheader(candidate_title)

            # Show article
            expander = st.expander("Read article")
            expander.write(candidate_article.replace("$", "\\$"))

            # Show tags
            complete_prompt = rec.create_prompt(candidate_article)
            tags = rec.extract_tags(complete_prompt)
            st.markdown(tags)
            st.write("------")

            count += 1

        if count == SHOW_TOP:
            break
