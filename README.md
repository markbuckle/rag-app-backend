# Deploy RAG/AI App To AWS

## Overview

AI apps tend to use many platform specific binaries in its dependencies. This is challenging because some of these dependencies are sensitive to things like os/windows version, python version, and CPU architecture. What ends up happeing quite often is that apps that run perfectly fine on your machine, ends up breaking in strange ways once you've deployed it and attempt to run it in the cloud. I used Docker to turn our project into a container that creates a consistent virtual environment that you can deploy anywhere. Once you have the Docker image set up correctly you should be able to deploy to AWS. The cloud infrastructure will be written in AWS CDK which can be used to deploy to our AWS account.

## RAG App

Insert Retrieval Augmented Generation apps description 

This app chatbot will be able to use the PDFs as a datasource.

## Getting Started:

### Install Requirements

Set up virtual environment then run:
```pwsh
pip install -r image/requirements.txt
```

### Building the Vector DB

Put all the PDF source files you want into `image/src/data/source/`. Then go `image` and run:

Use "--reset" if you want to overwrite an existing DB:
```pwsh
python populate_database.py --reset
```
Load the database and provide the response:
```pwsh
python rag_app\query_rag.py
```
## Architecture Overview

<img width=800 src="https://github.com/markbuckle/AiAppDeploy/blob/main/architecture.png?raw=true">

### Create FastAPI Wrapper

Import FastAPI and create a new FastAPI app:
```py
from fastapi import FastAPI
from rag_app.query_rag import query_rag, QueryResponse

app= FastAPI()
```
Create a new API route to handle the query and generate a response:
```py
@app.post("/submit_query")
def submit_query_endpoint(request: SubmitQueryRequest) -> QueryModel:
    # Create the query item, and put it into the data-base.
    new_query = QueryModel(query_text=request.query_text)
```
Test locally using:
```py
if __name__ == "__main__":
    port = 8000
    print(f"Running the FastAPI server on port {port}.")
    uvicorn.run("app_api_handler:app", host="0.0.0.0", port=port)
```
To make this work with AWS Lambda, wrap the FastAPI app with the handler adapter library function. This turns it into a lambda compatible handler:
```py
from mangum import Mangum

app = FastAPI()
handler = Mangum(app)
```
Run:
```pwsh
python app_api_handler.py
```
You should see something like this:

<img width=600 src="https://github.com/markbuckle/AiAppDeploy/blob/main/localtest.png?raw=true">

If the default address 0.0.0.0:8000 does not work, try manually typing 127.0.0.1.8000 into your URL instead.

You can also type 0.0.0.0:8000/docs or 127.0.0.1.8000/docs to see the FastAPI endpoints. Go to the /submit_query endpoint and try it out. Replace the string with something like 'How can I recover faster?" You should see something like:

<img width=800 src="https://github.com/markbuckle/AiAppDeploy/blob/main/submitquery.png?raw=true">

With this code we've now put our entire app inside an API. Next we have to figure out how to deploy it.

### Docker image

Create a dockerfile within the /image folder

Run:
```pwsh
python populate_database.py --reset
```

If you see the /chroma folder within your /data folder you should be good to go.

Update your dockerfile code:
```txt
FROM public.ecr.aws/lambda/python:3.12

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Required to make SQLlite3 work for Chroma.
RUN pip install pysqlite3-binary

# Install the specified packages
RUN pip install -r requirements.txt --upgrade

# For local testing.
EXPOSE 8000

# Set IS_USING_IMAGE_RUNTIME Environment Variable
ENV IS_USING_IMAGE_RUNTIME=True

# Copy all files in ./src
COPY src/* ${LAMBDA_TASK_ROOT}
COPY src/rag_app ${LAMBDA_TASK_ROOT}/rag_app
COPY src/data/chroma ${LAMBDA_TASK_ROOT}/data/chroma
```

### Configure AWS

You need to have an AWS account, and AWS CLI set up on your machine. You'll also need to have Bedrock enabled on AWS (and granted model access to Claude or whatever you want to use). If you haven't done this before there are plenty of good resources on Amazon's website and/or youtube tutorials.

### Update .env File with AWS Credentials

Create a file named `.env` in `image/`. Do NOT commit the file to `.git`. The file should have content like this:

```
AWS_ACCESS_KEY_ID=XXXXX
AWS_SECRET_ACCESS_KEY=XXXXX
AWS_DEFAULT_REGION=us-east-1
TABLE_NAME=YourTableName
```

This will be used by Docker for when we want to test the image locally. The AWS keys are just your normal AWS credentials and region you want to run this in (even when running locally you will still need access to Bedrock LLM and to the DynamoDB table to write/read the data).

You'll also need a TABLE_NAME for the DynamoDB table for this to work. Don't worry about this right away. You'll need to create one once we started using a table to store the results from our app.

### Running the App

```sh
# Execute from image/src directory
cd image/src
python rag_app/query_rag.py "how much does a landing page cost?"
```

Example output:

```text
Answer the question based on the above context: How much does a landing page cost to develop?

Response:  Based on the context provided, the cost for a landing page service offered by Galaxy Design Agency is $4,820. Specifically, under the "Our Services" section, it states "Landing Page for Small Businesses ($4,820)" when describing the landing page service. So the cost listed for a landing page is $4,820.
Sources: ['src/data/source/galaxy-design-client-guide.pdf:1:0', 'src/data/source/galaxy-design-client-guide.pdf:7:0', 'src/data/source/galaxy-design-client-guide.pdf:7:1']
```

## Using Docker Image

### Build and Test the Image Locally

These commands can be run from `image/` directory to build, test, and serve the app locally.

```pwsh
docker build --platform linux/amd64 -t aws_rag_app .
```

This will build the image (using linux amd64 as the platform — we need this for `pysqlite3` for Chroma).

```pwsh
# Run the container using command `python app_work_handler.main`
docker run --rm -it \
    --entrypoint python \
    --env-file .env \
    aws_rag_app app_work_handler.py
```

This will test the image, seeing if it can run the RAG/AI component with a hard-coded question (see ` app_work_handler.py`). But since it uses Bedrock as the embeddings and LLM platform, you will need an AWS account and have all the environment variables for your access set (`AWS_ACCESS_KEY_ID`, etc).

You will also need to have Bedrock's models enabled and granted for the region you are running this in.

## Running Locally as a Server

Assuming you've build the image from the previous step.

```pwsh
docker run --rm -p 8000:8000 --entrypoint python --env-file .env aws_rag_app /var/task/app_api_handler.py
```
If it runs correctly, it should look something like:
<img width=600 src="https://github.com/markbuckle/AiAppDeploy/blob/main/rundocker.png?raw=true">

If the above command doesn't work, it might be worth reviewing the [docker run documentation](https://docs.docker.com/engine/reference/run/).



## Testing Locally

After running the Docker container on localhost, you can access an interactive API page locally to test it: `http://0.0.0.0:8000/docs`.

```pwsh
curl -X 'POST' \
  'http://0.0.0.0:8000/submit_query' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "query_text": "How much does a landing page for a small business cost?"
}'
```

## Unit Testing

Once you have a server running locally on `localhost:8000`, you can run the unit tests in `test/` from the root folder. You'll need to have `pytest` installed (`pip install pytest`).

```sh
pytest  # Run all tests
```

```sh
pytest -k test_can_submit_query -s  # Run a specific test. Print output.
```

## Deploy to AWS

I have put all the AWS CDK files into `rag-cdk-infra/`. Go into the folder and install the Node dependencies.

```sh
npm install
```

Then run this command to deploy it (assuming you have AWS CLI already set up, and AWS CDK already bootstrapped). I recommend deploying to `us-east-1` to start with (since all the AI models are there).

```sh
cdk deploy
```

## Front End

### Install Tools to Generate API Client

```sh
npm install @openapitools/openapi-generator-cli -g
```

There is a command script in the package.json file to generate the client library for the API.

```json
{
  "generate-api-client": "openapi-generator-cli generate -i http://0.0.0.0:8000/openapi.json -g typescript-fetch -o src/api-client"
}
```

To use it, it will fetch the OpenAPI schema from `http://0.0.0.0:8000` (assuming it's a FastAPI server and makes it available). And generate a TypeScript client to `src/api-client`.

We'll need to make sure it's generated each time.

### Generate API Client

Generate the client into `src/api-client/` first.

```sh
npm run generate-api-client
```

### Component Library

Using shadcn/ui. I don't think you need to run this, it's already part of the project via Git — but here's what I had to run, just for reference.

```sh
npx shadcn-ui@latest init
```

Then install each component separately.

```sh
npx shadcn-ui@latest add button
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add card
npx shadcn-ui@latest add skeleton
```
