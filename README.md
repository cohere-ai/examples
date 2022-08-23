# Examples
A central repo where many demos using the Cohere API will live.

## How to add a new Streamlit project

1. Create a new folder for your app
2. Inside the app folder, create a file named `app.yaml.jinja`
The contents of that file should look like this:

```
runtime: python
env: flex
service: PUT-YOUR-APP-NAME-HERE

runtime_config:
  python_version: 3

entrypoint: streamlit run PUT-YOUR-APP-MAIN-FILE-NAME-HERE.py --server.port $PORT

automatic_scaling:
  max_num_instances: 1

env_variables:
  CO_KEY: {{ CO_KEY }}
  # More environment variables go here

```

3. In the root of the repository there is a directory called `./github/workflows/` inside that directory create a file `deploy-PUT-YOUR-APP-NAME-HERE.yaml`
The contents of that file should look like this:

```
name: Deploy Streamlit App "YOUR APP NAME HERE"

on:
  push:
    branches: [main]
    paths:
      - PUT-YOUR-APP-NAME-HERE/**

jobs:
  deploy-PUT-YOUR-APP-NAME-HERE:
    name: Deploy YOUR APP NAME HERE
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        id: checkout
        uses: actions/checkout@v2

      - name: Create app.yaml
        uses: cuchi/jinja2-action@v1.2.0
        with:
          template: PUT-YOUR-APP-NAME-HERE/app.yaml.jinja
          output_file: PUT-YOUR-APP-NAME-HERE/app.yaml
          strict: true
          variables: |
            CO_KEY=${{ secrets.COHERE_API_KEY }}
            # More environment variables go here

      - name: Auth
        id: auth
        uses: google-github-actions/auth@v0
        with:
          credentials_json: "${{ secrets.GCP_CREDENTIALS }}"

      - name: Deploy
        id: deploy
        uses: google-github-actions/deploy-appengine@v0
        with:
          deliverables: PUT-YOUR-APP-NAME-HERE/app.yaml

      - name: Healthcheck
        id: curl-api
        run: curl "${{ steps.deploy.outputs.url }}/healthz"

```

4. More environment variables can be added by updating the `env_variables` section of app.yaml.jinja and the `Create app.yaml` step of the github workflow.
