import streamlit as st
from typing import Optional
import numpy as np
from utils import process_csv_file, get_embeddings_from_df, embed_stuff, get_augmented_prompts, co_client, process_text_input

TEMPERATURE = 0.6
MAX_TOKENS = 100

@st.cache_data
def read_csv_data(st_file_obj,run_id: Optional[str]= None):
  return process_csv_file(st_file_obj,run_id=run_id)

def generate(prompt, max_tokens=None):
    if max_tokens is None:
        max_tokens = MAX_TOKENS
    response = co_client.generate( 
    model='command-xlarge-nightly', 
    prompt=prompt,
    max_tokens=max_tokens, 
    temperature=TEMPERATURE, 
    return_likelihoods='NONE')

    return response

st.title("Document Question Answering")

option = st.selectbox("Input type", ["TEXT BOX", "CSV"])
df = None
if option == "CSV":
    train_file = st.file_uploader('Upload File (Single column CSV with a header called "text")', type=["csv"])
    embeddings = None
    if train_file is not None:
        df, _, _, _ = read_csv_data(train_file)

elif option == "TEXT BOX":
    text = st.text_area("Paste the Document", height=250)
    if text != "":
        df, _, _, _ = process_text_input(text)

if df is not None:
    embeddings = get_embeddings_from_df(df)

if df is not None:
    prompt = st.text_input('Ask a question')
    advanced_options = st.checkbox("Advanced options")
    if advanced_options:
        TEMPERATURE = st.slider('temperature', min_value=0.0, max_value=1.0, value=TEMPERATURE)
        MAX_TOKENS = st.slider('max_tokens', min_value=1, max_value=1000, value=MAX_TOKENS)
        
if df is not None and prompt != "":
    base_prompt = "Based on the passage above, answer the following question:"
    prompt_embedding = embed_stuff([prompt])
    aug_prompts = get_augmented_prompts(np.array(prompt_embedding), embeddings, df)
    new_prompt = '\n'.join(aug_prompts) + '\n\n' + base_prompt + '\n' + prompt + '\n'
    print(new_prompt)
    is_success = False
    while not is_success:
        try:
            response = generate(new_prompt)
            is_success = True
        except Exception:
            aug_prompts = aug_prompts[:-1]
            new_prompt = '\n'.join(aug_prompts) + '\n' + base_prompt + '\n' + prompt

    st.write(response.generations[0].text)