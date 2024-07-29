FROM python:3.12-slim

# Install GCC and G++
RUN apt-get update && apt-get install -y \
    gcc g++ make

# Set the LAMBDA_TASK_ROOT environment variable
ENV LAMBDA_TASK_ROOT=/var/task

# Copy requirements.txt to the working directory
COPY requirements.txt ${LAMBDA_TASK_ROOT}/requirements.txt

# Required to make SQLite3 work for Chroma.
RUN pip install pysqlite3-binary

# Install the specified packages
RUN pip install -r ${LAMBDA_TASK_ROOT}/requirements.txt --upgrade

# For local testing.
EXPOSE 8000

# Set IS_USING_IMAGE_RUNTIME Environment Variable
ENV IS_USING_IMAGE_RUNTIME=True

# Copy all files in ./src
COPY src/* ${LAMBDA_TASK_ROOT}
COPY src/rag_app ${LAMBDA_TASK_ROOT}/rag_app
COPY src/data/chroma ${LAMBDA_TASK_ROOT}/data/chroma
