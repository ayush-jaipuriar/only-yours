WITH merged_answers AS (
    SELECT
        MIN(id) AS keeper_id,
        game_session_id,
        question_id,
        user_id,
        MAX(round1_answer) AS merged_round1_answer,
        MAX(round2_guess) AS merged_round2_guess
    FROM game_answers
    GROUP BY game_session_id, question_id, user_id
)
UPDATE game_answers AS ga
SET
    round1_answer = merged_answers.merged_round1_answer,
    round2_guess = merged_answers.merged_round2_guess
FROM merged_answers
WHERE ga.id = merged_answers.keeper_id;

DELETE FROM game_answers AS ga
USING (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY game_session_id, question_id, user_id
            ORDER BY id
        ) AS duplicate_rank
    FROM game_answers
) AS ranked_answers
WHERE ga.id = ranked_answers.id
  AND ranked_answers.duplicate_rank > 1;

ALTER TABLE game_answers
    ADD CONSTRAINT uk_game_answers_session_question_user
        UNIQUE (game_session_id, question_id, user_id);
