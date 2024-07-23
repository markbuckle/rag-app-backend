FROM ubuntu:22.04

# Set the working directory in the container
WORKDIR /var/task

# Install the necessary build tools, compiler, and SQLite development package
RUN apt-get update && \
    apt-get install -y build-essential gcc python3-dev python3-pip sqlite3 libsqlite3-dev

# Upgrade pip to the latest version
RUN pip3 install --upgrade pip

# Copy the requirements file into the container
COPY requirements.txt .

# Required to make SQLite3 work for Chroma.
RUN pip3 install pysqlite3-binary

# Install any needed packages specified in requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# For local testing.
EXPOSE 8000

# Set IS_USING_IMAGE_RUNTIME Environment Variable
ENV IS_USING_IMAGE_RUNTIME=True

# Copy all files in ./src
COPY src/app_api_handler.py .
COPY src/rag_app ./rag_app
COPY src/data/chroma ./data/chroma

# Command to run the application
CMD ["python3", "app_api_handler.handler"]
