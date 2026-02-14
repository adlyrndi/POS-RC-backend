-- Create a function to atomically decrement stock
-- reliable way to handle race conditions
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, quantity_to_subtract int)
RETURNS boolean AS $$
BEGIN
  -- Check if stock is sufficient
  IF (SELECT stock FROM products WHERE id = product_id) >= quantity_to_subtract THEN
    -- Update stock
    UPDATE products
    SET stock = stock - quantity_to_subtract,
        updated_at = now()
    WHERE id = product_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;
