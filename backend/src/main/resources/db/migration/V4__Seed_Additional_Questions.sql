-- V4: Seed additional questions for categories with fewer than 8
-- Sprint 5 prerequisite: all categories must have at least 8 questions for gameplay

-- Additional questions for "Getting to Know You" (currently 4, adding 5 more)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What type of music do you enjoy most?', 'Pop', 'Rock', 'Classical', 'Hip-hop' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your dream vacation destination?', 'Paris', 'Tokyo', 'Maldives', 'New York' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you prefer to spend a rainy day?', 'Reading a book', 'Watching movies', 'Cooking something new', 'Sleeping in' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your favorite season?', 'Spring', 'Summer', 'Fall', 'Winter' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If you could have any pet, what would it be?', 'Dog', 'Cat', 'Something exotic', 'No pets' FROM question_categories WHERE name = 'Getting to Know You';


-- Additional questions for "Daily Habits" (currently 4, adding 5 more)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your guilty pleasure snack?', 'Chocolate', 'Chips', 'Ice cream', 'Candy' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How long does it take you to get ready in the morning?', 'Under 15 minutes', '15-30 minutes', '30-60 minutes', 'Over an hour' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What do you do right before falling asleep?', 'Scroll my phone', 'Read a book', 'Listen to music', 'Talk to you' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you organize your workspace?', 'Everything in its place', 'Organized chaos', 'Messy but I know where things are', 'I clean it once a week' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your preferred way to exercise?', 'Running', 'Gym workout', 'Yoga', 'I avoid exercise' FROM question_categories WHERE name = 'Daily Habits';


-- Additional questions for "Memories" (currently 4, adding 5 more)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What song reminds you most of us?', 'A romantic ballad', 'An upbeat pop song', 'A classic hit', 'Our wedding or special song' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What was the funniest moment we have shared?', 'A cooking disaster', 'A travel mishap', 'An embarrassing public moment', 'A silly argument' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is the best gift you have ever received from me?', 'Something handmade', 'A surprise trip', 'A meaningful piece of jewelry', 'A heartfelt letter' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What was our most adventurous experience together?', 'Trying extreme sports', 'Traveling somewhere new', 'Spontaneous road trip', 'Trying exotic food' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What holiday or celebration was most special for us?', 'Christmas or New Year', 'Valentine''s Day', 'A birthday celebration', 'Our anniversary' FROM question_categories WHERE name = 'Memories';


-- Additional questions for "Intimacy" (currently 4, adding 5 more)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is the most romantic thing I have done for you?', 'A surprise date', 'A love letter', 'A spontaneous trip', 'Being there when I needed you most' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How important is physical touch in our relationship?', 'Very important', 'Somewhat important', 'Nice but not essential', 'I show love in other ways' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What makes you feel most appreciated by me?', 'When you notice the little things', 'When you say thank you', 'When you do something thoughtful', 'When you spend quality time with me' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is one thing that always puts you in a good mood?', 'A hug from you', 'A compliment', 'Hearing your laugh', 'Doing something fun together' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you prefer to resolve disagreements with me?', 'Talk it out calmly', 'Take space first, then discuss', 'Write our feelings down', 'Hug it out and move on' FROM question_categories WHERE name = 'Intimacy';
