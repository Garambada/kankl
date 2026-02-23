
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- member, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Speakers Table
CREATE TABLE IF NOT EXISTS speakers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    expertise VARCHAR(255),
    persona_model JSONB, -- Stores attributes for AI persona (tone, style)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    speaker_id INTEGER REFERENCES speakers(id),
    booking_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Advisory Conversations (Chat Sessions)
CREATE TABLE IF NOT EXISTS advisory_conversations (
    id TEXT PRIMARY KEY, -- UUID
    user_id INTEGER REFERENCES users(id),
    speaker_id INTEGER REFERENCES speakers(id),
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Advisory Messages (Chat History)
CREATE TABLE IF NOT EXISTS advisory_messages (
    id TEXT PRIMARY KEY, -- UUID
    conversation_id TEXT REFERENCES advisory_conversations(id),
    role VARCHAR(50) NOT NULL, -- user, assistant
    content TEXT NOT NULL,
    sources JSONB, -- RAG sources used for this response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Briefings (Daily Intelligence)
CREATE TABLE IF NOT EXISTS briefings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    summary TEXT,
    content JSONB, -- Structured briefing content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_speaker_id ON bookings(speaker_id);
CREATE INDEX idx_messages_conversation_id ON advisory_messages(conversation_id);
