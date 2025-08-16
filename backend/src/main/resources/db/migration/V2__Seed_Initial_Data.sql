-- Seed initial categories and questions for Sprint 3

-- Categories
INSERT INTO question_categories (name, description, is_sensitive) VALUES
('Getting to Know You', 'Light prompts to learn more about each other', FALSE),
('Daily Habits', 'Routines, preferences, and quirks', FALSE),
('Memories', 'Shared moments and favorite memories', FALSE),
('Intimacy', 'Romance and relationship closeness', TRUE),
('Spicy Secrets', 'Intimate and revealing questions', TRUE),
('Fun Hypotheticals', 'Intriguing "what if" scenarios', FALSE),
('Relationship Deep Dive', 'Exploring the dynamics of your relationship', TRUE);

-- Tolerate older schemas where Hibernate may have created camelCase columns without underscores
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'optiona'
    ) THEN
        ALTER TABLE questions ALTER COLUMN optiona DROP NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'optionb'
    ) THEN
        ALTER TABLE questions ALTER COLUMN optionb DROP NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'optionc'
    ) THEN
        ALTER TABLE questions ALTER COLUMN optionc DROP NOT NULL;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'optiond'
    ) THEN
        ALTER TABLE questions ALTER COLUMN optiond DROP NOT NULL;
    END IF;
END
$$ LANGUAGE plpgsql;

-- Questions for Getting to Know You
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your ideal weekend activity?', 'Hiking', 'Binge-watching shows', 'Trying new restaurants', 'Staying in and reading' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Which cuisine do you crave most often?', 'Italian', 'Mexican', 'Asian', 'Indian' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a skill you would like to learn together?', 'Cooking', 'Dancing', 'A new language', 'Playing an instrument' FROM question_categories WHERE name = 'Getting to Know You';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your favorite thing about our relationship?', 'Our humor', 'Our support for each other', 'Our adventures', 'Our quiet moments' FROM question_categories WHERE name = 'Getting to Know You';


-- Questions for Daily Habits
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Are you an early bird or a night owl?', 'Early bird', 'Night owl', 'Depends on the day', 'Neither' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you prefer to start your morning?', 'Coffee first', 'Workout', 'Quiet time', 'Check messages' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your go-to method for de-stressing?', 'Exercise', 'Meditation', 'Talking it out', 'Watching a movie' FROM question_categories WHERE name = 'Daily Habits';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you feel about sharing food?', 'Love it', 'Hate it', 'Depends on the food', 'Only if you ask first' FROM question_categories WHERE name = 'Daily Habits';


-- Questions for Memories
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What kind of trip would you like to take together next?', 'Beach', 'Mountains', 'City exploration', 'Staycation' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Your favorite type of date night?', 'Movie night', 'Dinner out', 'Game night', 'Live event' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a memory of us that always makes you smile?', 'Our first date', 'A funny mishap', 'A special trip', 'A quiet evening in' FROM question_categories WHERE name = 'Memories';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Which of our anniversaries has been your favorite so far?', 'The first one', 'The most recent one', 'The one we celebrated big', 'The one that was simple and sweet' FROM question_categories WHERE name = 'Memories';


-- Questions for Intimacy (sensitive)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you most feel loved?', 'Words of affirmation', 'Quality time', 'Physical touch', 'Acts of service' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What kind of surprise do you like?', 'Thoughtful notes', 'Planned outings', 'Small gifts', 'Spontaneous gestures' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is one thing you would like to do more of in our intimate life?', 'More cuddling', 'More date nights', 'More deep conversations', 'More spontaneous affection' FROM question_categories WHERE name = 'Intimacy';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What makes you feel most connected to me?', 'When we laugh together', 'When we support each other through tough times', 'When we are physically close', 'When we have deep conversations' FROM question_categories WHERE name = 'Intimacy';


-- Questions for Spicy Secrets (sensitive)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a secret fantasy you have never told me?', 'Something adventurous', 'Something romantic', 'Something kinky', 'I will never tell' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your biggest turn-on?', 'Confidence', 'A specific look', 'A certain smell', 'A type of touch' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your biggest turn-off?', 'Arrogance', 'Bad hygiene', 'Clinginess', 'Lack of ambition' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'Have you ever had a dream about me?', 'Yes, a romantic one', 'Yes, a weird one', 'Yes, a spicy one', 'No, not yet' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is something you find sexy that you think is weird?', 'A particular accent', 'A specific clothing item', 'A certain habit', 'A nerdy interest' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is the most adventurous thing you have ever done in the bedroom?', 'Role-playing', 'Tried a new location', 'Used toys', 'I am not telling' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you feel about public displays of affection?', 'Love them', 'A little bit is okay', 'I prefer to be private', 'It depends on the place' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a question you are too scared to ask me?', 'About my past', 'About our future', 'About my feelings', 'About my desires' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is your favorite part of my body?', 'My eyes', 'My smile', 'My hands', 'I love all of it' FROM question_categories WHERE name = 'Spicy Secrets';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a non-physical trait you find most attractive about me?', 'Your kindness', 'Your intelligence', 'Your sense of humor', 'Your passion' FROM question_categories WHERE name = 'Spicy Secrets';


-- Questions for Fun Hypotheticals
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If we could have any superpower, what would it be?', 'Invisibility', 'Flying', 'Teleportation', 'Mind reading' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If we won the lottery, what is the first thing we would do?', 'Buy a house', 'Travel the world', 'Quit our jobs', 'Invest it all' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If you could swap lives with any fictional character for a day, who would it be?', 'A superhero', 'A wizard', 'A detective', 'A royalty' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If we could time travel, where would we go?', 'The future', 'The past', 'The roaring twenties', 'The swinging sixties' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If we had to be stranded on a deserted island, what three things would you bring?', 'A good book', 'A survival kit', 'A photo of us', 'Unlimited snacks' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If you could have dinner with any three people, dead or alive, who would they be?', 'A famous scientist', 'A historical figure', 'A celebrity crush', 'My favorite author' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If we were a famous duo, who would we be?', 'Bonnie and Clyde', 'Romeo and Juliet', 'Batman and Robin', 'Shrek and Fiona' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If you could eliminate one chore for the rest of your life, what would it be?', 'Doing the dishes', 'Doing laundry', 'Cleaning the bathroom', 'Grocery shopping' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If you could have any exotic pet, what would it be?', 'A monkey', 'A tiger', 'A penguin', 'A dragon' FROM question_categories WHERE name = 'Fun Hypotheticals';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'If our love story was a movie, what genre would it be?', 'Romantic comedy', 'Action-adventure', 'Indie drama', 'A musical' FROM question_categories WHERE name = 'Fun Hypotheticals';


-- Questions for Relationship Deep Dive (sensitive)
INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is something you think we could do to improve our communication?', 'Be more open', 'Listen more actively', 'Argue more constructively', 'Have more check-ins' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a fear you have about our relationship?', 'Losing the spark', 'Growing apart', 'Not meeting expectations', 'Repeating past mistakes' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a deal-breaker for you in a relationship?', 'Infidelity', 'Dishonesty', 'Lack of respect', 'Different life goals' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you think we handle conflict?', 'We are great at it', 'We could be better', 'We avoid it', 'We argue a lot' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What does a successful relationship look like to you?', 'Complete trust', 'Constant laughter', 'Shared goals', 'Passionate romance' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is something you need from me that you are not getting enough of?', 'More affection', 'More appreciation', 'More alone time', 'More support' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is a dream you have for our future together?', 'To travel the world', 'To build a home', 'To start a family', 'To grow old together' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is one thing you have learned from our relationship?', 'How to love', 'How to be a better person', 'How to compromise', 'How to be vulnerable' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'How do you feel about our work-life balance as a couple?', 'It is perfect', 'It needs improvement', 'We need more quality time', 'We need more personal time' FROM question_categories WHERE name = 'Relationship Deep Dive';

INSERT INTO questions (category_id, text, option_a, option_b, option_c, option_d)
SELECT id, 'What is one thing you would like to change about our routine?', 'More spontaneous trips', 'More date nights', 'More time outdoors', 'More cozy nights in' FROM question_categories WHERE name = 'Relationship Deep Dive';
