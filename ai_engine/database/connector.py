
import os
from qdrant_client import QdrantClient
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

def get_qdrant_client():
    """Get Qdrant Client"""
    url = os.getenv("QDRANT_URL", "http://localhost:6333")
    api_key = os.getenv("QDRANT_API_KEY", None)
    return QdrantClient(url=url, api_key=api_key)

def get_neo4j_driver():
    """Get Neo4j Driver"""
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USERNAME", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password") # Default from docker-compose
    return GraphDatabase.driver(uri, auth=(user, password))
