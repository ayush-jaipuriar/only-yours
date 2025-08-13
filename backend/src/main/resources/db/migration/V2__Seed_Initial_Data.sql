-- Seed initial categories and questions for Sprint 3

-- Categories
INSERT INTO question_categories (name, description, is_sensitive) VALUES
('Getting to Know You', 'Light prompts to learn more about each other', FALSE),
('Daily Habits', 'Routines, preferences, and quirks', FALSE),
('Memories', 'Shared moments and favorite memories', FALSE),
('Intimacy', 'Romance and relationship closeness', TRUE);

-- Questions for Getting to Know You
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your ideal weekend activity?', 'Hiking', 'Binge-watching shows', 'Trying new restaurants', 'Staying in and reading' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Which cuisine do you crave most often?', 'Italian', 'Mexican', 'Asian', 'Indian' FROM question_categories WHERE name = 'Getting to Know You';

-- Questions for Daily Habits
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Are you an early bird or a night owl?', 'Early bird', 'Night owl', 'Depends on the day', 'Neither' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you prefer to start your morning?', 'Coffee first', 'Workout', 'Quiet time', 'Check messages' FROM question_categories WHERE name = 'Daily Habits';

-- Questions for Memories
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What kind of trip would you like to take together next?', 'Beach', 'Mountains', 'City exploration', 'Staycation' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Your favorite type of date night?', 'Movie night', 'Dinner out', 'Game night', 'Live event' FROM question_categories WHERE name = 'Memories';

-- Questions for Intimacy (sensitive)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you most feel loved?', 'Words of affirmation', 'Quality time', 'Physical touch', 'Acts of service' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What kind of surprise do you like?', 'Thoughtful notes', 'Planned outings', 'Small gifts', 'Spontaneous gestures' FROM question_categories WHERE name = 'Intimacy';


