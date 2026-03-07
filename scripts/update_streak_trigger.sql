CREATE OR REPLACE FUNCTION update_streak_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today date := CURRENT_DATE;
  last_review date;
  current_streak int;
BEGIN
  SELECT last_review_date, current_streak INTO last_review, current_streak
  FROM user_streaks
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_review_date, total_reviews)
    VALUES (NEW.user_id, 1, 1, today, 1);
  ELSE
    IF last_review = today - interval '1 day' THEN
      current_streak := current_streak + 1;
    ELSIF last_review < today - interval '1 day' THEN
      current_streak := 1;
    END IF;

    UPDATE user_streaks
    SET
      current_streak = current_streak,
      longest_streak = GREATEST(longest_streak, current_streak),
      last_review_date = today,
      total_reviews = total_reviews + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_added ON spaced_repetition_reviews;
CREATE TRIGGER review_added
  AFTER INSERT ON spaced_repetition_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_review();
