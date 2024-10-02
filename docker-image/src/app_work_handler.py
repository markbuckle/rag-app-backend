from query_model import QueryModel
from rag_app.query_rag import query_rag


def handler(event, context):
    query_item = QueryModel(**event)
    invoke_rag(query_item)


# invoke rag application with query item.
def invoke_rag(query_item: QueryModel):
    rag_response = query_rag(query_item.query_text)
    # update query model with our new responses
    query_item.answer_text = rag_response.response_text
    query_item.sources = rag_response.sources
    query_item.is_complete = True
    # helper function to save back to the database
    query_item.put_item()
    # these two lines are optional
    print(f"✅ Item is updated: {query_item}")
    return query_item


# test locally to ensure this part works
def main():
    print("Running example RAG call.")
    query_item = QueryModel(query_text="How do I increase neuroplasticity?")
    response = invoke_rag(query_item)
    print(f"Received: {response}")


if __name__ == "__main__":
    # For local testing.
    main()
