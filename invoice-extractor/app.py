import streamlit as st
from st_clickable_images import clickable_images

import base64
import glob
import os
from PyPDF2 import PdfReader
from PIL import Image
from pdf2image import convert_from_path

from utils import get_vendor_name, parse_data, parse_annotations, construct_prompt

import cohere

api_key = os.environ["COHERE_API_KEY"]
co = cohere.Client(api_key)

st.set_page_config(page_title="Template Gallery",layout="wide")

test_pdf_dir = os.path.join("test_set", "pdf")
test_image_dir = os.path.join("test_set", "images")

test_invoices = glob.glob(os.path.join(test_pdf_dir, '*'))
test_invoices.sort()

test_image_list  = []
test_image_paths = []

st.markdown("# Select Invoice to Extract!")

for test_invoice in test_invoices:
    base_name = os.path.basename(test_invoice)
    file_name = base_name.split(".")[0]

    # Convert first page of uploaded pdf to image
    image = convert_from_path(test_invoice)[0]
    image_path = os.path.join(test_image_dir, f"{file_name}.jpg")
    image.save(image_path, 'JPEG')
    with open(image_path, 'rb') as f:
        image_content = f.read()
        encoded = base64.b64encode(image_content).decode()
        test_image_list.append(f"data:image/jpeg;base64,{encoded}")
    test_image_paths.append(image_path)

test_clicked = clickable_images(test_image_list,
    titles=test_image_paths,
    div_style={"display": "flex", "justify-content": "start", "overflow-x": "auto"},
    img_style={"margin": "5px", "height": "500px"},
)

def extract_invoice(idx, test_image_paths):
    # Get template name by running image classification
    template = get_vendor_name(test_image_paths[idx])

    # Collect raw text, annotation of training data
    texts = parse_data(template)
    annotations = parse_annotations(template)

    # Collect all fields to extract
    fields = annotations[0].keys()

    # Collect raw text of the document to predict
    reader = PdfReader(test_invoices[idx])
    first_page = reader.pages[0]
    test_text = first_page.extract_text()

    col1, col2 = st.columns(2)
    with col1:
      st.image(test_image_paths[idx])
    with col2:
      for field in fields:
          prompt = construct_prompt(texts, annotations, field, test_text)
          response = co.generate(
              model='small',
              prompt=prompt,
              max_tokens=50,
              temperature=0.3,
              k=0,
              p=1,
              frequency_penalty=0,
              presence_penalty=0,
              stop_sequences=["====="],
              return_likelihoods='NONE')
          st.markdown(f"### {field}:{response.generations[0].text[:-5]}")
      st.markdown("### Finished Extracting")
    return template

# Classify template name
if test_clicked > -1:
    extract_invoice(test_clicked, test_image_paths)
