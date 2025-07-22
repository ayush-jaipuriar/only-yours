CREATE TABLE users (
    id UUID PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE couples (
    id UUID PRIMARY KEY,
    user1_id UUID REFERENCES users(id),
    user2_id UUID REFERENCES users(id),
    link_code VARCHAR(255) UNIQUE
);

CREATE TABLE question_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES question_categories(id),
    text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL
);

CREATE TABLE game_sessions (
    id UUID PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id),
    status VARCHAR(255) NOT NULL,
    player1_score INTEGER,
    player2_score INTEGER
);

CREATE TABLE game_answers (
    id UUID PRIMARY KEY,
    game_session_id UUID NOT NULL REFERENCES game_sessions(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    round1_answer VARCHAR(255),
    round2_guess VARCHAR(255)
); 