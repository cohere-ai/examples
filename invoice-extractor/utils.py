import glob
import numpy as np
import os
import json
from PIL import Image

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from torch.autograd import Variable

# Load the pretrained model
model = models.resnet18(pretrained=True)
# Use the model object to select the desired layer
layer = model._modules.get('avgpool')

# Set model to evaluation mode
model.eval()

scaler = transforms.Resize((224, 224))
normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
to_tensor = transforms.ToTensor()

cos = nn.CosineSimilarity(dim=1, eps=1e-6)

MAX_EXAMPLES=4

THRESHOLD = 0.95

# Returns image embedding given image path
def get_vector(image_path):
    img = Image.open(image_path)
    img_tensor = Variable(normalize(to_tensor(scaler(img))).unsqueeze(0))
    img_embedding = torch.zeros(512)
    def copy_data(m, i, o):
        img_embedding.copy_(o.data.reshape(o.data.size(1)))
    h = layer.register_forward_hook(copy_data)
    output = model(img_tensor)
    h.remove()
    return img_embedding

# Get image embedding vector and compute cosine similarity
def image_resnet_score(img1, img2):
    img1_score = get_vector(img1)
    img2_score = get_vector(img2)
    cos_sim = cos(img1_score.unsqueeze(0),img2_score.unsqueeze(0))
    return cos_sim

# Given image path, get the most similar template name
def get_vendor_name(image_path):
    scores = []

    # Compute similarity scores for each vendors
    vendor_paths = glob.glob(os.path.join("vendors", "*"))
    for vendor_path in vendor_paths:
        vendor_dir = os.path.join(vendor_path, 'image', "*")
        vendor_files =  glob.glob(vendor_dir)
        for vendor_file in vendor_files:
            scores.append(image_resnet_score(image_path, vendor_file))

    # Get the highest score and select the template if it exceeds threshold
    max_score = max(scores)
    if max_score > THRESHOLD:
        max_ind = scores.index(max_score)
        vendor_name = vendor_paths[max_ind].split("/")[1]
        return vendor_name
    return None

# Given the vendor name, we collect all the raw text of training data
def parse_data(vendor_name):
    text_dir = os.path.join('vendors', vendor_name, "text", "*")
    text_files = glob.glob(text_dir)
    text_files.sort()
    contents = []
    for text_file in text_files:
        with open(text_file) as f:
            content = f.read()
            contents.append(content)
    return contents

# Given the vendor name, we collect all the annotations of training data
def parse_annotations(vendor_name):
    anno_dir = os.path.join('vendors', vendor_name, "annotations", "*")
    anno_files = glob.glob(anno_dir)
    anno_files.sort()
    contents = []
    for anno_file in anno_files:
        with open(anno_file) as f:
            content = json.loads(f.read())
            contents.append(content)
    return contents

# Create prompt consisting of raw text and annotation of training data,
# the field we want to extract, and the raw text of the document we want to predict.
def construct_prompt(texts, annotations, field, test_text):
    prompts = []
    separator = "\n=====\n"
    for text, annotation in zip(texts[:MAX_EXAMPLES], annotations[:MAX_EXAMPLES]):
        prompt = text + "\n"
        anno_prompt = f"\n{field}: "
        anno_prompt += annotation[field]
        prompt += anno_prompt
        prompts.append(prompt)
    return separator.join(prompts) + "\n=====\n" + test_text + f"\n\n{field}:"
