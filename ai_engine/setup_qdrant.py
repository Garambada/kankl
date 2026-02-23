
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

# Initialize Qdrant Client
# Note: Ensure Qdrant is running on localhost:6333
client = QdrantClient(host="localhost", port=6333)

def setup_collection():
    collection_name = "speaker_knowledge"
    
    # Check if collection exists
    collections = client.get_collections()
    if any(c.name == collection_name for c in collections.collections):
        print(f"Collection '{collection_name}' already exists.")
        return

    # Create Collection
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=3072,  # text-embedding-3-large dimension
            distance=Distance.COSINE
        )
    )
    print(f"✅ Qdrant collection '{collection_name}' created successfully.")

if __name__ == "__main__":
    try:
        setup_collection()
    except Exception as e:
        print(f"Failed to setup Qdrant: {e}")
