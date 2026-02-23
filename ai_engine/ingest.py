
import os
import argparse
import asyncio
from typing import List
from dotenv import load_dotenv

from ai_engine.data_collection.loader import UpstageDocumentLoader
from ai_engine.data_collection.chunker import ContentChunker
from ai_engine.data_collection.graph_extractor import GraphExtractor
from ai_engine.database.connector import get_qdrant_client, get_neo4j_driver
from langchain_upstage import UpstageEmbeddings

# Load env
load_dotenv()

import json

async def ingest_document(file_path: str, speaker_name: str = "General"):
    print(f"=== Starting Ingestion for {file_path} (Speaker: {speaker_name}) ===")
    
    # 1. Load
    loader = UpstageDocumentLoader()
    docs = []
    
    if file_path.endswith(".json"):
        # Custom JSON loader for our KB format
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                # Expecting list of dicts with 'content' field
                if isinstance(data, list):
                    from langchain_core.documents import Document
                    for item in data:
                        content = item.get('content', '')
                        metadata = item.get('metadata', {})
                        metadata['source'] = file_path
                        metadata['speaker_name'] = speaker_name # Inject Speaker
                        if content:
                             docs.append(Document(page_content=content, metadata=metadata))
        except Exception as e:
            print(f"Failed to load JSON: {e}")
            return
    elif file_path.endswith(".md"):
        docs = loader.load_markdown(file_path)
    else:
        # PDF or Image
        docs = loader.load(file_path)
    
    # Validation
    if not docs:
        print("No documents loaded.")
        return

    # 2. Chunk (Skip chunking for JSON if they are already small usage units? Or chunk anyway)
    # Let's chunk to be safe for long essays
    chunker = ContentChunker()
    chunks = chunker.chunk_documents(docs)
    
    # Ensure metadata carries over if chunker stripped it (Langchain usually keeps it)
    for chunk in chunks:
        chunk.metadata['speaker_name'] = speaker_name
    
    # 3. Indexing (Vector + Graph)
    # Initialize Clients
    qdrant = get_qdrant_client()
    neo4j = get_neo4j_driver()
    embeddings = UpstageEmbeddings(model="solar-embedding-1-large")
    graph_extractor = GraphExtractor()
    
    collection_name = "speaker_knowledge"
    
    # Vector Indexing (Batch)
    print("[Ingest] Indexing Vectors in Qdrant...")
    points = []
    
    # Simple batch processing
    import uuid
    from qdrant_client.http import models
    
    # Ensure collection exists
    try:
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(size=4096, distance=models.Distance.COSINE) # Solar Embedding size
        )
        print(f"[Ingest] Created collection '{collection_name}'")
    except Exception as e:
        # Check if error is 'Collection already exists' (409 Conflict)
        if "already exists" in str(e) or "409" in str(e):
            print(f"[Ingest] Collection '{collection_name}' already exists. Proceeding...")
        else:
            print(f"[Ingest] Warning: Failed to create collection (might exist): {e}")

    for i, chunk in enumerate(chunks):
        try:
            vector = embeddings.embed_query(chunk.page_content)
            point_id = str(uuid.uuid4())
            
            points.append(models.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "source": chunk.metadata.get("source", file_path),
                    "chunk_text": chunk.page_content,
                    "chunk_index": i,
                    "speaker_name": speaker_name # Query Filter
                }
            ))
        except Exception as e:
             print(f"Embedding error for chunk {i}: {e}")
        
        # Graph Extraction (Skip for now to speed up robustness check, or keep if fast)
        # For this specific task of "Persona", RAG is more critical.
        
    # Upsert Vectors
    if points:
        qdrant.upsert(
            collection_name=collection_name,
            points=points
        )
        print(f"[Ingest] Successfully indexed {len(points)} vectors for {speaker_name}.")
        
    print("=== Ingestion Complete ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest documents into AI Engine")
    parser.add_argument("--file", type=str, required=True, help="Path to document")
    parser.add_argument("--speaker", type=str, default="General", help="Speaker Name for Metadata filtering")
    args = parser.parse_args()
    
    asyncio.run(ingest_document(args.file, args.speaker))
