import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dataclasses import dataclass
from typing import List
from langchain.prompts import ChatPromptTemplate
from langchain_aws import ChatBedrock
from get_chroma_db import get_chroma_db

PROMPT_TEMPLATE = """
Answer the question based only on the following context: {context}

---

Answer the question based on the above context: {question}
"""

BEDROCK_MODEL_ID = "amazon.titan-text-express-v1"
# BEDROCK_MODEL_ID = "amazon.titan-text-premier-v1:0"


@dataclass
class QueryResponse:
    query_text: str
    response_text: str
    sources: List[str]


# this is the core function of the app
def query_rag(query_text: str) -> QueryResponse:
    db = get_chroma_db()

    # Search the DB.
    results = db.similarity_search_with_score(query_text, k=5)
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    print(prompt)

    model = ChatBedrock(model_id=BEDROCK_MODEL_ID)
    # try:
    response = model.invoke(prompt, temperature=0.5)
    response_text = response.content
    # except Exception as e:
    # print(f"Error invoking model: {e}")
    #     return QueryResponse(
    #         query_text=query_text, response_text="Error generating response", sources=[]
    #     )

    # Rephrase and format the response
    # formatted_response = format_response(response_text)

    # Truncate the response to a maximum of 150 characters
    # truncated_response = truncate_response(formatted_response, max_length=250)

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    print(f"Response: {response_text}\nSources: {sources}")

    return QueryResponse(
        query_text=query_text, response_text=response_text, sources=sources
    )


# def format_response(response_text: str) -> str:
#     # Example of rephrasing and formatting the response
#     lines = response_text.split(". ")
#     formatted_lines = [f"- {line.strip().capitalize()}." for line in lines if line]
#     return "\n".join(formatted_lines)


# def truncate_response(response_text: str, max_length: int) -> str:
#     if len(response_text) <= max_length:
#         return response_text
#     truncated_text = response_text[:max_length].rsplit(" ", 1)[0]
#     return truncated_text + "..."


if __name__ == "__main__":
    query_rag("How long should I work or study for at a time?")
