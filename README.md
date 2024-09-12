# AI PDF(podcast) Chatbot - Backend

## RAG Apps

Large Language Models (LLM)s are models for general-purpose language understanding and generation. The problem with LLMs is that they lack information about your specific use case / users. This is where Retrieval Augmented Generation (RAG) comes into play. 

RAG = LLM + Knowledge base

RAGs allow for models to have specific infomation pertaining to certain subjects or use cases. This RAG app chatbot will be able to use specific podcast PDFs as its datasource.

## Architecture Overview

The AI services used for the embeddings and chat is cloud-based already (AWS bedrock). Aside from that, the app runs locally and the database is saved locally. An API endpoint is a FastAPI server that wraps the app and lets us call it using API routes.

For the actual hosting I used AWS Lambda to deploy this as a serverless function. Lambda is essentially a virtual server that only starts up when we send a request to it then it shuts down by itself. Thus it is extremely cheap and scalable. Lambda doesn't natively understand FastAPI's interface so I added a handler adapter to fix that.

This app uses a lot of different platform specific binanaries in its dependencies. This makes this app sensitive to things like Windows/OS version, Python version, and CPU architecture. Often such apps can run successfully locally, but break after you've deployed it and try to run it in the cloud. To make sure that anyone can run this app anywhere, I placed the App itself, handler, API, and database into a Docker container image. This creates a consistent virtual environment. The Lambda function uses the image and the API endpoint allows users to access it. The AI component is external to all of this.

To create all of the Cloud infrastructure, I used AWS CDK to allow me to deploy it to my AWS account. This allows one to access this app via a public API endpoint.

<img maxwidth=1000 src="https://github.com/markbuckle/AiAppDeploy/blob/main/architecture.png?raw=true">

## Build Steps

### Build the foundation of the RAG app with Langchain and a LLM of your choice with Python

[LangChain](https://www.langchain.com/) is a framework designed to simplify the creation of applications using large language models. As a language model integration framework, LangChain's use-cases largely overlap with those of language models in general, including document analysis and summarization, chatbots, and code analysis. 

In this app, I decided to use LangChain and AWS Bedrock's LLM's.

### Preparing the data

Choose a datasource. Could be a collection of pdfs or text files. In my case I am using transcript pdfs that I generated from a podcast. 

Try to make the data as clean as possible before pdf'ing it.

See the **populate_database.py** file for this code.

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

### Create FastAPI Wrapper

Once code is setup run:
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

Update your Dockerfile code.

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

These commands can be run from `/image` directory to build, test, and serve the app locally.

```pwsh
docker build --platform linux/amd64 -t aws_rag_app .
```

This will build the image (using linux amd64 as the platform — we need this for `pysqlite3` for Chroma).

You will also need to have Bedrock's models enabled and granted for the region you are running this in.

### Running Locally as a Server

Assuming you've built the image from the previous step.

```pwsh
docker run --rm -p 8000:8000 --entrypoint python --env-file .env aws_rag_app /var/task/app_api_handler.py
```
If it runs correctly, it should look something like:
<img width=800 src="https://github.com/markbuckle/AiAppDeploy/blob/main/rundocker.png?raw=true">

If the docker run command didn't work, it might be worth reviewing the [docker run documentation](https://docs.docker.com/engine/reference/run/) and adjusting the entrypoint, port or env-files according to your specific setup.

You may need to change the 0.0.0.0:8000 link to 127.0.0.1:8000 manually. Also manually enter /docs to access the FastAPI endpoints.

## Unit Testing 

Once you have a server running locally on `localhost:8000`, you can run the unit tests in `test/` from the root folder. You'll need to have `pytest` installed (`pip install pytest`).

```sh
pytest  # Run all tests
```

```sh
pytest -k test_can_submit_query -s  # Run a specific test. Print output.
```

## AWS CDK to create Cloud Infrastructure

Enable all of the AWS Bedrock LLM models that you want to use for this app if you have not already

### Create a CDK Project

This can only be done in an empty directory. Create a new folder:
```pwsh
mkdir rag-cdk-infra
```
```pwsh
cd rag-cdk-infra
```
```pwsh
cdk init app --language=typescript
```

Update code. 

Go to your terminal, hop in the /rag-cdk-infra folder and make sure you are using an updated AWS CDK CLI:
```pwsh
npm install -g aws-cdk@latest
```
Bootstrap with:
```pwsh
cdk bootstrap
```
Finally, deploy your app using:
```pwsh
cdk deploy
```

### Save and Load Results

To save query responses to a database, we'll need to add a datbase table to our infrastructure and modify our code to use that table. To achieve this we'll use DynamoDB. 

Update the rag-cdk-infra-stack.ts code.

Create a new file called query_model.py (see file for code).

Once the code is updated, re-deploy using:
```pwsh
cdk deploy
```

Go to the AWS Dynamo DB console to get your updated TABLE_NAME.

If you want to test this locally from your Docker Image, don't forget to update your .env file with the TABLE_NAME=...

## ASYNC Execution

Right now, our app uses AI which can take quite a long time to execute. It might be 5-15 seconds depending on the query size. If we extend the app later, this could get much worse (30s or more). This is a big problem since API Endpoint has max 30s timeout and high latency is risky for HTTP as it leaves your connection vulnerable to interuption or network outages. Not to mention probably a very bad user experience. The best solution here is to make our API asynchronous. It doesn't make the overall use of the application faster but it does make it more responsive and we don't have to maintain an open connection the whole time.

To implement this we'll have to split our Lambda into two separate functions. The user will only interact with our API function and that will trigger an asynchronous execution of the worker function in the background. 

<img width=800 src="https://github.com/markbuckle/AiAppDeploy/blob/main/asyncfunction.png?raw=true">

Since the 30s timeout is a property of the API endpoint itself and not the Lambda funciton we can now configure the worker function to have a much longer timeout (up to 15 minutes). This is very good if we have a large tak for the Worker to perform.

For simplicity in this app, I have only modified the entry point of the function. 

Start by adding a new handler function in a new file called app_work_handler.py (see code).

Update the app_api_handler.py function and the rag-cdk-infra-stack.ts file.

Run:
```py
cdk deploy
```
The /submit-query API endpoint won't generate an answer right away, but it will give oyu a query_id. Copy this id and paste it in the /get_query id. This will allow us to get an answer faster than waiting for the response to generage just in the submit_query API.

## API Updates

### Add query limits

We need to add some limits to the size of queries so we don't accidentally get expensive API bills from very large queries. 

We'll also need to test that it works:
```pwsh
cdk deploy
```

### update DB model with user_id and ttl, and add a GSI

We want to be able to list all queries submitted by a user. So first we need to add a `user_id` to the item model, and a GSI so we can search by user/time. We may also want a `ttl` field to help us expire old entries (useful for testing).

### add the list_queries API

Use the database GSI and model we created earlier to add a new API to list query items by user. Add some integration tests for it.

### add CORS headers to the API

We need these CORS headers to make it work with our frontend.

