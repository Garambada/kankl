
import os
import json
from typing import List, Dict, Any
from langchain_upstage import ChatUpstage
from langchain_core.documents import Document
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

# Define Pydantic models for structured output
class Entity(BaseModel):
    name: str = Field(description="Name of the entity, e.g., 'Park Tae-woong', 'AI Ethics'")
    type: str = Field(description="Type of the entity, e.g., 'Person', 'Concept', 'Regulation'")
    description: str = Field(description="Brief description or context of the entity")

class Relation(BaseModel):
    source: str = Field(description="Name of the source entity")
    target: str = Field(description="Name of the target entity")
    type: str = Field(description="Type of relationship, e.g., 'RELATED_TO', 'DEFINED_BY', 'ADVOCATES'")

class GraphData(BaseModel):
    entities: List[Entity]
    relations: List[Relation]

class GraphExtractor:
    def __init__(self):
        self.llm = ChatUpstage(model="solar-pro3", temperature=0.0)
        
    def extract_graph_from_chunk(self, chunk: Document) -> Dict[str, Any]:
        """
        Extract entities and relations from a text chunk using Solar LLM.
        """
        text = chunk.page_content[:4000] # Limit context window if needed
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Knowledge Graph extraction expert.
            Analyze the following text and extract key Entities (Person, Organization, Concept, Regulation, Technology) 
            and their Relationships.
            
            Return the output in valid JSON format matching this schema:
            {{
                "entities": [{{"name": "...", "type": "...", "description": "..."}}],
                "relations": [{{"source": "...", "target": "...", "type": "..."}}]
            }}
            
            Focus on high-level concepts relevant to Boardroom/Executive briefings.
            Avoid extracting trivial or generic entites.
            """),
            ("user", "Text: {text}")
        ])
        
        # Using .with_structured_output if available, or just parsing JSON
        # langchain-upstage supports structured output? If not, valid JSON mode or strict prompting
        # Solar Pro is good at JSON instructions.
        
        chain = prompt | self.llm
        
        try:
            response = chain.invoke({"text": text})
            content = response.content
            
            # Clean up potential markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            data = json.loads(content)
            return data
        except Exception as e:
            print(f"[GraphExtractor] Error parsing graph data: {e}")
            return {"entities": [], "relations": []}
