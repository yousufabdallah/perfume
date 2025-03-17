-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  reference_id TEXT,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to create notifications for inventory transfers
CREATE OR REPLACE FUNCTION create_inventory_transfer_notification()
RETURNS TRIGGER AS $$
DECLARE
  branch_manager_id UUID;
  from_branch_name TEXT;
  to_branch_name TEXT;
BEGIN
  -- Get branch names
  SELECT name INTO from_branch_name FROM branches WHERE id = NEW.from_branch_id;
  SELECT name INTO to_branch_name FROM branches WHERE id = NEW.to_branch_id;
  
  -- If it's a new transfer request
  IF TG_OP = 'INSERT' THEN
    -- Notify the manager of the source branch
    SELECT id INTO branch_manager_id FROM users 
    WHERE branch_id = NEW.from_branch_id AND role = 'branch_manager' 
    LIMIT 1;
    
    IF branch_manager_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        branch_manager_id,
        'طلب نقل مخزون جديد',
        'تم إنشاء طلب نقل مخزون جديد من ' || from_branch_name || ' إلى ' || to_branch_name,
        'inventory_transfer',
        NEW.id,
        'inventory_transfer'
      );
    END IF;
  
  -- If the transfer status has changed
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- If approved, notify the requester
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        NEW.requested_by,
        'تمت الموافقة على طلب نقل المخزون',
        'تمت الموافقة على طلب نقل المخزون من ' || from_branch_name || ' إلى ' || to_branch_name,
        'inventory_transfer',
        NEW.id,
        'inventory_transfer'
      );
    
    -- If rejected, notify the requester
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        NEW.requested_by,
        'تم رفض طلب نقل المخزون',
        'تم رفض طلب نقل المخزون من ' || from_branch_name || ' إلى ' || to_branch_name,
        'inventory_transfer',
        NEW.id,
        'inventory_transfer'
      );
    
    -- If completed, notify both branch managers
    ELSIF NEW.status = 'completed' THEN
      -- Notify requester
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        NEW.requested_by,
        'تم إكمال طلب نقل المخزون',
        'تم إكمال طلب نقل المخزون من ' || from_branch_name || ' إلى ' || to_branch_name,
        'inventory_transfer',
        NEW.id,
        'inventory_transfer'
      );
      
      -- Notify approver if different from requester
      IF NEW.approved_by IS NOT NULL AND NEW.approved_by != NEW.requested_by THEN
        INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
        VALUES (
          NEW.approved_by,
          'تم إكمال طلب نقل المخزون',
          'تم إكمال طلب نقل المخزون من ' || from_branch_name || ' إلى ' || to_branch_name,
          'inventory_transfer',
          NEW.id,
          'inventory_transfer'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory transfers
DROP TRIGGER IF EXISTS inventory_transfer_notification_trigger ON inventory_transfers;
CREATE TRIGGER inventory_transfer_notification_trigger
AFTER INSERT OR UPDATE ON inventory_transfers
FOR EACH ROW
EXECUTE FUNCTION create_inventory_transfer_notification();

-- Function to create notifications for low stock
CREATE OR REPLACE FUNCTION create_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
  branch_manager_id UUID;
  product_name TEXT;
  branch_name TEXT;
BEGIN
  -- Only trigger if quantity is below min_quantity and it wasn't before
  IF NEW.quantity <= NEW.min_quantity AND (OLD.quantity > OLD.min_quantity OR TG_OP = 'INSERT') THEN
    -- Get product name
    SELECT name INTO product_name FROM products WHERE id = NEW.product_id;
    
    -- Get branch name
    SELECT name INTO branch_name FROM branches WHERE id = NEW.branch_id;
    
    -- Get branch manager
    SELECT id INTO branch_manager_id FROM users 
    WHERE branch_id = NEW.branch_id AND role = 'branch_manager' 
    LIMIT 1;
    
    IF branch_manager_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        branch_manager_id,
        'تنبيه: مخزون منخفض',
        'المنتج "' || product_name || '" في فرع ' || branch_name || ' وصل إلى مستوى منخفض (' || NEW.quantity || ')',
        'low_stock',
        NEW.product_id,
        'low_stock'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock
DROP TRIGGER IF EXISTS low_stock_notification_trigger ON inventory;
CREATE TRIGGER low_stock_notification_trigger
AFTER INSERT OR UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION create_low_stock_notification();
