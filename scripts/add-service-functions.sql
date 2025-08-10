-- Create function to increment service views
CREATE OR REPLACE FUNCTION increment_service_views(service_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE services 
  SET views = views + 1 
  WHERE id = service_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update service rating when reviews are added
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE services 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM reviews 
      WHERE service_id = NEW.service_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update service rating when reviews are added
CREATE TRIGGER update_service_rating_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_rating();

-- Create trigger to update service rating when reviews are updated
CREATE TRIGGER update_service_rating_update_trigger
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_rating();

-- Create trigger to update service rating when reviews are deleted
CREATE TRIGGER update_service_rating_delete_trigger
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_rating();
