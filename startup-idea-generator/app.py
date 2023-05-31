# Copyright (c) 2023 Cohere Inc. and its affiliates.
#
# Licensed under the MIT License (the "License");
# you may not use this file except in compliance with the License.
#
# You may obtain a copy of the License in the LICENSE file at the top
# level of this repository.

import cohere
import streamlit as st
import os

# Cohere API key
api_key = os.environ["CO_KEY"]

# Set up Cohere client
co = cohere.Client(api_key)


def generate_idea(startup_industry, creativity):
    """
    Generate startup idea given an industry name
    Arguments:
    industry(str): the industry name
    temperature(str): the Generate model `temperature` value
    Returns:
    response(str): the startup idea
    """
    idea_prompt = f"""Generate a startup idea given the industry. Here are a few examples.

--
Industry: Workplace
Startup Idea: A platform that generates slide deck contents automatically based on a given outline

--
Industry: Home Decor
Startup Idea: An app that calculates the best position of your indoor plants for your apartment

--
Industry: Healthcare
Startup Idea: A hearing aid for the elderly that automatically adjusts its levels and with a battery \
lasting a whole week

--
Industry: Education
Startup Idea: An online primary school that lets students mix and match their own curriculum based on \
their interests and goals

--
Industry:{startup_industry}
Startup Idea: """

    # Call the Cohere Generate endpoint
    response = co.generate(
        model="command-nightly",
        prompt=idea_prompt,
        max_tokens=50,
        temperature=creativity,
        k=0,
        stop_sequences=["--"],
    )
    startup_idea = response.generations[0].text
    print(idea_prompt)
    print("startup_idea - pre", startup_idea)
    startup_idea = startup_idea.replace("\n\n--", "").replace("\n--", "").strip()
    print("startup_idea - post", startup_idea)
    print("-------------")
    return startup_idea


def generate_name(startup_idea, creativity):
    """
    Generate startup name given a startup idea
    Arguments:
    idea(str): the startup idea
    temperature(str): the Generate model `temperature` value
    Returns:
    response(str): the startup name
    """

    name_prompt = f"""Generate a startup name and name given the startup idea. Here are a few examples.

--
Startup Idea: A platform that generates slide deck contents automatically based on a given outline
Startup Name: Deckerize

--
Startup Idea: An app that calculates the best position of your indoor plants for your apartment
Startup Name: Planteasy

--
Startup Idea: A hearing aid for the elderly that automatically adjusts its levels and with a battery \
lasting a whole week
Startup Name: Hearspan

--
Startup Idea: An online primary school that lets students mix and match their own curriculum based on \
their interests and goals
Startup Name: Prime Age

--
Startup Idea:{startup_idea}
Startup Name:"""

    # Call the Cohere Generate endpoint
    response = co.generate(
        model="command-nightly",
        prompt=name_prompt,
        max_tokens=10,
        temperature=creativity,
        k=0,
        stop_sequences=["--"],
    )
    startup_name = response.generations[0].text
    startup_name = startup_name.replace("\n\n--", "").replace("\n--", "").strip()

    return startup_name


# The front end code starts here

st.title("🚀 Startup Idea Generator")

form = st.form(key="user_settings")
with form:
    # User input - Industry name
    industry_input = st.text_input("Industry", key="industry_input")

    # Create a two-column view
    col1, col2 = st.columns(2)
    with col1:
        # User input - The number of ideas to generate
        num_input = st.slider(
            "Number of ideas",
            value=3,
            key="num_input",
            min_value=1,
            max_value=10,
            help="Choose to generate between 1 to 10 ideas",
        )
    with col2:
        # User input - The 'temperature' value representing the level of creativity
        creativity_input = st.slider(
            "Creativity",
            value=0.5,
            key="creativity_input",
            min_value=0.1,
            max_value=0.9,
            help="Lower values generate more “predictable” output, higher values generate more “creative” output",
        )
    # Submit button to start generating ideas
    generate_button = form.form_submit_button("Generate Idea")

    if generate_button:
        if industry_input == "":
            st.error("Industry field cannot be blank")
        else:
            my_bar = st.progress(0.05)
            st.subheader("Startup Ideas:")

            for i in range(num_input):
                st.markdown("""---""")
                idea = generate_idea(industry_input, creativity_input)
                name = generate_name(idea, creativity_input)
                st.markdown("##### " + name)
                st.write(idea)
                my_bar.progress((i + 1) / num_input)
