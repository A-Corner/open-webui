import requests
from typing import List, Dict, Any
from langchain_core.documents import Document
from open_webui.models.rag_services import RagService
from open_webui.env import log # Assuming a logger is available

def query_external_rag_service(rag_service: RagService, query: str) -> List[Document]:
    """
    Queries an external RAG service and returns a list of Document objects.
    """
    headers = {}
    if rag_service.api_key:
        headers["Authorization"] = f"Bearer {rag_service.api_key}"

    params = {"query": query}

    try:
        response = requests.get(rag_service.url, headers=headers, params=params, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()

        # Assuming the external service returns JSON like: {"results": [{"page_content": "...", "metadata": {...}}]}
        results = data.get("results", [])

        documents = []
        for res in results:
            if isinstance(res, dict) and "page_content" in res:
                page_content = res["page_content"]
                metadata = res.get("metadata", {})
                documents.append(Document(page_content=page_content, metadata=metadata))
            else:
                log.warning(f"Unexpected item format in RAG service response: {res}")

        return documents

    except requests.exceptions.RequestException as e:
        log.error(f"Error querying external RAG service {rag_service.name} ({rag_service.url}): {e}")
        return []
    except requests.exceptions.JSONDecodeError as e: # Changed from json.JSONDecodeError
        log.error(f"Error decoding JSON response from {rag_service.name} ({rag_service.url}): {e}")
        return []
    except Exception as e:
        log.error(f"Unexpected error querying {rag_service.name} ({rag_service.url}): {e}")
        return []

def add_documents_to_external_rag_service(rag_service: RagService, documents: List[Document]) -> bool:
    """
    Adds documents to an external RAG service.
    """
    headers = {"Content-Type": "application/json"}
    if rag_service.api_key:
        headers["Authorization"] = f"Bearer {rag_service.api_key}"

    # Convert Document objects to a list of dictionaries
    docs_to_send = []
    for doc in documents:
        docs_to_send.append({
            "page_content": doc.page_content,
            "metadata": doc.metadata,
            # Assuming the external service might want an 'id' if available in metadata
            "id": doc.metadata.get("id", None)
        })

    payload = {"documents": docs_to_send}

    try:
        # This assumes the external RAG service has an endpoint for adding documents,
        # which might be the base URL or a specific path like /documents or /index.
        # For this generic implementation, we'll POST to the base service URL.
        response = requests.post(rag_service.url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        # Assuming a successful response (e.g., 200 OK or 201 Created) indicates success.
        # Some services might return a more detailed JSON response.
        log.info(f"Successfully added {len(documents)} documents to {rag_service.name}")
        return True

    except requests.exceptions.RequestException as e:
        log.error(f"Error adding documents to external RAG service {rag_service.name} ({rag_service.url}): {e}")
        return False
    except Exception as e:
        log.error(f"Unexpected error adding documents to {rag_service.name} ({rag_service.url}): {e}")
        return False

def delete_documents_from_external_rag_service(rag_service: RagService, document_ids: List[str]) -> bool:
    """
    Deletes documents from an external RAG service using their IDs.
    """
    headers = {}
    if rag_service.api_key:
        headers["Authorization"] = f"Bearer {rag_service.api_key}"

    # The method (DELETE, POST) and payload format for deletion are highly service-specific.
    # Common patterns:
    # 1. DELETE request to an endpoint like /documents with IDs in the body or query params.
    # 2. POST request to an endpoint like /delete-documents with IDs in the body.
    # For this generic example, we'll assume a DELETE request with IDs in the JSON body.
    # This might need to be adjusted based on actual external RAG service APIs.
    payload = {"document_ids": document_ids}

    try:
        # This assumes the external RAG service has an endpoint for deleting documents.
        # It could be the base URL or a specific path like /documents.
        response = requests.delete(rag_service.url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        log.info(f"Successfully requested deletion of {len(document_ids)} documents from {rag_service.name}")
        return True

    except requests.exceptions.RequestException as e:
        log.error(f"Error deleting documents from external RAG service {rag_service.name} ({rag_service.url}): {e}")
        return False
    except Exception as e:
        log.error(f"Unexpected error deleting documents from {rag_service.name} ({rag_service.url}): {e}")
        return False
