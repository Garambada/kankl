
from neo4j import GraphDatabase

# Neo4j Connection Details
URI = "bolt://localhost:7687"
AUTH = ("neo4j", "devpassword")

def create_constraints(tx):
    """Create uniqueness constraints for the Knowledge Graph nodes."""
    # Expert ID uniqueness
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Expert) REQUIRE e.speaker_id IS UNIQUE")
    # Concept ID uniqueness
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (c:Concept) REQUIRE c.concept_id IS UNIQUE")
    # Topic ID uniqueness
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (t:Topic) REQUIRE t.topic_id IS UNIQUE")
    # Document ID uniqueness
    tx.run("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Document) REQUIRE d.doc_id IS UNIQUE")

def setup_graph():
    driver = GraphDatabase.driver(URI, auth=AUTH)
    try:
        with driver.session() as session:
            session.execute_write(create_constraints)
            print("✅ Neo4j constraints created successfully.")
    except Exception as e:
        print(f"Failed to setup Neo4j: {e}")
    finally:
        driver.close()

if __name__ == "__main__":
    setup_graph()
