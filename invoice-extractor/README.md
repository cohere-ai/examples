# Invoice Extraction App powered by Cohere API
Invoice Extraction Demo project on Streamlit

## Installation

To install project dependencies,

```
pip install -r requirements.txt
```

To run the project locally

```
export APT_KEY="<YOUR COHERE API KEY GOES HERE>"
streamlit run app.py
```
## How to Create the APP

In this article, we will create an app that automates information extraction from invoice documents.
We will create a streamlit app that can extract invoice documents when user click the document. You will need your API key to create this application

### Step 1: Data Collection
We first need to prepare documents that we will use for training and prediction. For training data, we will keep them in `vendors` directory. It will follow the following file tree structure.

```
├── <vendor_name>
│   ├── annotations
│   │   ├── <invoice1>.json
│   │   ├── <invoice2>.json
│   │   └── <invoice3>.json
│   ├── image
│   │   └── <invoice1>.jpg
│   ├── pdf
│   │   ├── <invoice1>.pdf
│   │   ├── <invoice2>.pdf
│   │   └── <invoice3>.pdf
│   └── text
│       ├── <invoice1>.txt
│       ├── <invoice2>.txt
│       └── <invoice3>.txt
```

For documents that will be used for prediction, we will use `test_set` directory. It will follow the file tree structure like this.

```
├── images
│   ├── <predict1>.jpg
│   ├── <predict2>.jpg
│   ├── <predict3>.jpg
│   └── <predict4>.jpg
└── pdf
    ├── <predict1>.pdf
    ├── <predict2>.pdf
    ├── <predict3>.pdf
    └── <predict4>.pdf
```

### Step 2: Loading Dataset
Once we have these dataset prepared, we will first try to load the documents and have it rendered on the screen. If user click onto these document, we want it to extract information from the document.

Create a python file called `app.py`. We will use this file to run the streamlit app.

Let's first load all documents that will be used for prediction

```
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
```

### Step 3: Image Classification to Identify Template
Once user click on the document, we want to run extraction.

When extracting invoice, first step is to identify type of vendor. We will be using image classification to identify.

We use pretrained Resnet-18 to obtain embedding of training data. Then we find the most similar image to the test data above the threshold. If none of the training data is above the threshold, the application identifies as new template and reject the document.

Let's first load the image classification model.

```
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
```

Let's compute similarity score. We create a function `get_vendor_name` which iterate on each template image and compute similarity score with the target image that we want to predict with. Then it will output the name of the template it classified.

```
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
```

Let's put the functions we defined above together and create function `extract_invoice` which given the index of the docuemnt it is clicked, returns the extracted information.

```
MAX_EXAMPLES = 4

# Create prompt consisting of raw text and annotation of training data, the field we want to extract, and the raw text of the document we want to predict.
def construct_prompt(texts, annotations, field, test_text):
    prompts = []
    separator = "\n=====\n"
    for text, annotation in zip(texts[:MAX_EXAMPLES], annotations[:MAX_EXAMPLES]):
        prompt = text + "\n"
        value_list = annotation[field]
        anno_prompt = f"\n{field}: "
        anno_prompt += ", ".join(value_list)
        prompt += anno_prompt
        prompts.append(prompt)
    return separator.join(prompts) + "\n=====\n" + test_text + f"\n\n{field}:"

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
```

Finally let's call this function when a document get clicked

```
if test_clicked > -1:
    extract_invoice(test_clicked, test_image_paths)
```

You can get the full code in the repo [here](https://github.com/joon0711/invoice_demo)
