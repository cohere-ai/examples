# Copyright (c) 2023 Cohere Inc. and its affiliates.
#
# Licensed under the MIT License (the "License");
# you may not use this file except in compliance with the License.
#
# You may obtain a copy of the License in the LICENSE file at the top
# level of this repository.

import streamlit as st
import cohere
import numpy as np
import os

# Cohere API key
api_key = os.environ["CO_KEY"]

# Set up Cohere client
co = cohere.Client(api_key)

command_model = "command-xlarge-20221108"
few_shot = "xlarge-20221108"

freq = 0.20
n_gens = 3


# sends a single prediction to the cohere generate api
def generate(
    prompt, model_size=command_model, n_generations=n_gens, temp=0.75, tokens=250, stops=["--"], freq=freq
):
    prediction = co.generate(
        model=model_size,
        prompt=prompt,
        return_likelihoods="GENERATION",
        stop_sequences=stops,
        max_tokens=tokens,
        temperature=temp,
        num_generations=n_generations,
        k=0,
        frequency_penalty=freq,
        p=0.75,
    )
    return prediction


# returns max likelihood output
def max_likely(prediction):
    likelihood = []
    for i, pred in enumerate(prediction.generations):
        likelihood.append(pred.likelihood)
    max_value = np.argmax(likelihood)
    output = prediction.generations[max_value].text
    return output


def remove_duplicate_sentences_from_text(text):
    sentences = text.split(".")
    sentences = list(dict.fromkeys(sentences))
    return ".".join(sentences)


def remove_incomplete_sentence_from_end_of_paragraph(text):
    sentences = text.split(".")
    sentences = sentences[:-1]
    sentences[-1] = sentences[-1] + "."
    return ".".join(sentences)


favicon = "images/favicon.png"


# streamlit styling and configurations
st.set_page_config(
    page_title="Lazywriter - Free Generative AI Copywriter", page_icon=favicon,
)

hide_menu_style = """
        <style>
        #MainMenu {visibility: hidden;}
        </style>
        """
hide_streamlit_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            </style>
            """


st.image(
    "images/logo_transparent.png",
    caption=None,
    width=None,
    use_column_width=None,
    clamp=False,
    channels="RGB",
    output_format="auto",
)
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

st.markdown(hide_menu_style, unsafe_allow_html=True)


st.write(
    "This tool uses [Cohere](http://cohere.com) generative model to generate content for you."
    " Use it to create unique content and boost your productivity!"
)

use_case = st.selectbox(
    "Use Case",
    (
        "",
        "Blog Title and Content",
        "Essay from Outline",
        "Essay from Title",
        "Essay Outline from Title",
        "Review",
        "Product Description",
        "Custom",
    ),
)

# dynamic form
with st.form("lazywriter_form"):
    if use_case == "Custom":
        prompt = st.text_area(
            "Generate a custom prompt",
            placeholder="Try something like: Generate a blog post about the importance of Baroque music."
                        " Write it in a formal tone.",
        )
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        length = st.slider("Approximate Generation Length(words)", min_value=10, max_value=300, value=100)
    elif use_case == "Essay Outline from Title":
        tone = st.text_input("Tone(Optional)", placeholder="profesional, casual, etc.")
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        subject = st.text_area(
            "What should we write about!",
            placeholder="Try something like... The history of the United Nations and its role in global politics.",
        )
    if use_case == "Essay from Title":
        tone = st.text_input("Tone(Optional)", placeholder="profesional, casual, etc.")
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        subject = st.text_area(
            "What should we write about!",
            placeholder="Try something like...The causes and consequences of the Arab Spring.",
        )
    if use_case == "Essay from Outline":
        tone = st.text_input("Tone(Optional)", placeholder="profesional, casual, etc.")
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        subject = st.text_area(
            label="What should we write about!",
            placeholder="Use the essay outline from title tool to curate an outline "
                        "and then copy your results here",
        )
    if use_case == "Blog Title and Content":
        tone = st.text_input("Tone(Optional)", placeholder="profesional, casual, etc.")
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        subject = st.text_area(
            label="What should we write about!",
            placeholder="Try something like....Large Language Models are Not All Created Equal",
        )
    if use_case == "Product Description":
        tone = st.text_input("Tone(Optional)", placeholder="Steve Jobs, Snoop Dog, etc.")
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        subject = st.text_area(
            "Try something like....The new Apple iPhone 12 Pro Max.  Mention the great, camera, "
            "battery life, and screen.  The more details the better!"
        )
    if use_case == "Review":
        tone = st.text_input("Tone(Optional)", placeholder="profesional, casual, upset, etc.")
        creativity = st.slider(label="Creativity", min_value=0.0, max_value=3.0, value=1.0, step=0.25)
        subject = st.text_area(
            "What should we write about!",
            placeholder="Try something like....Our amazing waiter and diner at The Hula Hut in Austin, TX.  "
                        "Mention the great, service, food, and atmosphere.  The more details the better!",
        )
    submitted = st.form_submit_button("Start Writing!")

# use case controllers
with st.spinner("Generating Content..."):
    if submitted:
        if use_case == "Blog Title and Content":
            prompt = "Write a blog about \n\n " + subject + ".\n\n" + "Write it in a " + tone + " tone."
            prediction = generate(
                prompt=prompt, model_size=command_model, temp=creativity, tokens=800, stops=["----"]
            )
            content = max_likely(prediction)
            prompt2 = "Write a creative title for this blog. \n\n" + "Blog:" + content + "\n\nTitle:"
            prediction = generate(
                prompt=prompt2, model_size=command_model, temp=creativity, tokens=25, stops=["---"]
            )
            title = max_likely(prediction)
            st.header(title)
            st.write(content)
        if use_case == "Review":
            prompt = (
                "Write a yelp review about \n\n " + subject + ".\n\n" + "Write it in a " + tone + " tone."
            )
            prediction = generate(
                prompt=prompt, model_size=command_model, temp=creativity, tokens=300, stops=["----"]
            )
            content = max_likely(prediction)
            prompt2 = "Write a creative title for this review. \n\n" + "Review:" + content + "\n\nTitle:"
            prediction = generate(
                prompt=prompt2, model_size=command_model, temp=creativity, tokens=25, stops=["---"]
            )
            title = max_likely(prediction)
            st.header(title)
            st.write(content)
        if use_case == "Product Description":
            prompt = (
                "Write an ecommerce product description about\n\n "
                + subject
                + "\n\n"
                + "Write it in a "
                + tone
                + " tone."
            )
            prediction = generate(
                prompt=prompt, model_size=command_model, temp=creativity, tokens=300, stops=["----"]
            )
            content = max_likely(prediction)
            prompt2 = "Write a creative name for this product. \n\n" + "Product:" + content + "\n\nTitle:"
            prediction = generate(
                prompt=prompt2, model_size=command_model, temp=creativity, tokens=25, stops=["---"]
            )
            title = max_likely(prediction)
            st.header(title)
            st.write(content)
        if use_case == "Custom":
            prediction = generate(
                prompt=prompt, model_size=command_model, temp=creativity, tokens=length * 3, stops=["----"]
            )
            content = max_likely(prediction)
            st.write(content)
        if use_case == "Essay Outline from Title":
            with open("seeds/example_outline_2.txt", "r") as f:
                prior = f.read()
            prompt = (
                prior
                + "Write an outline for an essay titled "
                + subject
                + ". Write it in a "
                + tone
                + " tone."
            )
            prediction = generate(
                prompt=prompt, model_size=command_model, temp=creativity, tokens=400, stops=["----"]
            )
            content = max_likely(prediction)
            st.header(subject)
            st.write(content)
        if use_case == "Essay from Outline":
            with open("seeds/example_outline_to_essay_2.txt", "r") as f:
                prior = f.read()
            prompt = prior + "Outline:" + "\n" + subject + "\n" + "Essay:\n"
            prediction = generate(
                prompt=prompt, model_size=few_shot, temp=creativity, tokens=800, stops=["----"]
            )
            content = max_likely(prediction)
            st.write(content)
        if use_case == "Essay from Title":
            with open("seeds/example_outline_2.txt", "r") as f:
                prior = f.read()
            prompt = (
                prior
                + "Write an outline for an essay titled "
                + subject
                + ". Write it in a "
                + tone
                + " tone."
            )
            prediction = generate(
                prompt=prompt, model_size=command_model, temp=creativity, tokens=400, stops=["----"]
            )
            outline = max_likely(prediction)
            with open("seeds/example_outline_to_essay_2.txt", "r") as f:
                prior = f.read()
            prompt = prior + "Outline:" + "\n" + outline + "\n" + "Essay:\n"
            prediction = generate(
                prompt=prompt, model_size=few_shot, temp=creativity, tokens=800, stops=["----"]
            )
            content = max_likely(prediction)
            st.header(subject)
            st.write(content)
