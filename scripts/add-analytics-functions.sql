-- Create function to get booking analytics by date range
CREATE OR REPLACE FUNCTION get_booking_analytics(
  user_id UUID,
  user_type TEXT,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_bookings BIGINT,
  completed_bookings BIGINT,
  total_revenue NUMERIC,
  average_booking_value NUMERIC,
  completion_rate NUMERIC
) AS $$
DECLARE
  filter_column TEXT;
BEGIN
  filter_column := CASE 
    WHEN user_type = 'customer' THEN 'customer_id'
    ELSE 'provider_id'
  END;

  RETURN QUERY
  EXECUTE format('
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = ''completed'') as completed_bookings,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount) FILTER (WHERE total_amount IS NOT NULL), 0) as average_booking_value,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = ''completed'')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0 
      END as completion_rate
    FROM bookings 
    WHERE %I = $1 
      AND booking_date BETWEEN $2 AND $3
  ', filter_column)
  USING user_id, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top services by bookings
CREATE OR REPLACE FUNCTION get_top_services_by_bookings(
  provider_id UUID,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  service_id UUID,
  service_title TEXT,
  booking_count BIGINT,
  total_revenue NUMERIC,
  average_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as service_id,
    s.title as service_title,
    COUNT(b.id) as booking_count,
    COALESCE(SUM(b.total_amount), 0) as total_revenue,
    COALESCE(AVG(r.rating), 0) as average_rating
  FROM services s
  LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
  LEFT JOIN reviews r ON s.id = r.service_id
  WHERE s.provider_id = provider_id
  GROUP BY s.id, s.title
  ORDER BY booking_count DESC, total_revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get booking trends by day
CREATE OR REPLACE FUNCTION get_booking_trends(
  user_id UUID,
  user_type TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  booking_date DATE,
  booking_count BIGINT,
  revenue NUMERIC
) AS $$
DECLARE
  filter_column TEXT;
BEGIN
  filter_column := CASE 
    WHEN user_type = 'customer' THEN 'customer_id'
    ELSE 'provider_id'
  END;

  RETURN QUERY
  EXECUTE format('
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL ''%s days'',
        CURRENT_DATE,
        ''1 day''::interval
      )::date as date
    )
    SELECT 
      ds.date as booking_date,
      COALESCE(COUNT(b.id), 0) as booking_count,
      COALESCE(SUM(b.total_amount), 0) as revenue
    FROM date_series ds
    LEFT JOIN bookings b ON ds.date = b.booking_date AND b.%I = $1
    GROUP BY ds.date
    ORDER BY ds.date
  ', days_back, filter_column)
  USING user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get rating distribution
CREATE OR REPLACE FUNCTION get_rating_distribution(
  user_id UUID,
  user_type TEXT
)
RETURNS TABLE (
  rating INTEGER,
  count BIGINT
) AS $$
DECLARE
  filter_column TEXT;
BEGIN
  filter_column := CASE 
    WHEN user_type = 'customer' THEN 'customer_id'
    ELSE 'provider_id'
  END;

  RETURN QUERY
  EXECUTE format('
    WITH rating_series AS (
      SELECT generate_series(1, 5) as rating
    )
    SELECT 
      rs.rating,
      COALESCE(COUNT(r.id), 0) as count
    FROM rating_series rs
    LEFT JOIN reviews r ON rs.rating = r.rating AND r.%I = $1
    GROUP BY rs.rating
    ORDER BY rs.rating
  ', filter_column)
  USING user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get recent activity
CREATE OR REPLACE FUNCTION get_recent_activity(
  user_id UUID,
  user_type TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  activity_type TEXT,
  title TEXT,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
DECLARE
  customer_filter TEXT;
  provider_filter TEXT;
BEGIN
  customer_filter := CASE WHEN user_type = 'customer' THEN 'customer_id' ELSE 'provider_id' END;
  provider_filter := CASE WHEN user_type = 'provider' THEN 'provider_id' ELSE 'customer_id' END;

  RETURN QUERY
  (
    -- Recent bookings
    SELECT 
      'booking'::TEXT as activity_type,
      ('Booking ' || b.status)::TEXT as title,
      (s.title || ' - ' || b.customer_name)::TEXT as description,
      b.created_at as timestamp,
      b.status::TEXT as status
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE (user_type = 'customer' AND b.customer_id = user_id) 
       OR (user_type = 'provider' AND b.provider_id = user_id)
    ORDER BY b.created_at DESC
    LIMIT limit_count / 2
  )
  UNION ALL
  (
    -- Recent reviews
    SELECT 
      'review'::TEXT as activity_type,
      (CASE WHEN user_type = 'customer' THEN 'Review left' ELSE 'Review received' END)::TEXT as title,
      (r.rating::TEXT || ' stars for ' || s.title)::TEXT as description,
      r.created_at as timestamp,
      NULL::TEXT as status
    FROM reviews r
    JOIN services s ON r.service_id = s.id
    WHERE (user_type = 'customer' AND r.customer_id = user_id) 
       OR (user_type = 'provider' AND r.provider_id = user_id)
    ORDER BY r.created_at DESC
    LIMIT limit_count / 2
  )
  ORDER BY timestamp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings(status, booking_date);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_services_provider_status ON services(provider_id, status);

-- Create trigger to update booking statistics
CREATE OR REPLACE FUNCTION update_booking_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update service statistics when booking is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- This could trigger additional analytics updates
    PERFORM pg_notify('booking_completed', NEW.id::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_stats_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_stats();
