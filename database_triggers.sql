-- Database triggers for automatic activity tracking

-- 1. Trigger to update streaks when user logs in
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.user_id, 'daily_login', 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id, streak_type)
  DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      CASE 
        WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_streaks.current_streak + 1
        ELSE 1
      END,
      user_streaks.longest_streak
    ),
    last_activity_date = CURRENT_DATE,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for login activity
CREATE TRIGGER trigger_update_login_streak
  AFTER INSERT ON user_activities
  FOR EACH ROW
  WHEN (NEW.activity_type = 'login')
  EXECUTE FUNCTION update_login_streak();

 