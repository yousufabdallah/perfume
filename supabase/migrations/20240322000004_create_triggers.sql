-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON branches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_transfers_updated_at
BEFORE UPDATE ON inventory_transfers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_transfer_items_updated_at
BEFORE UPDATE ON inventory_transfer_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle inventory updates when transfers are completed
CREATE OR REPLACE FUNCTION process_inventory_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        -- Update inventory quantities
        UPDATE inventory
        SET quantity = inventory.quantity - transfer_item.quantity
        FROM inventory_transfer_items transfer_item
        WHERE transfer_item.transfer_id = NEW.id
        AND inventory.product_id = transfer_item.product_id
        AND inventory.branch_id = NEW.from_branch_id;
        
        -- Insert or update destination inventory
        INSERT INTO inventory (branch_id, product_id, quantity)
        SELECT NEW.to_branch_id, transfer_item.product_id, transfer_item.quantity
        FROM inventory_transfer_items transfer_item
        WHERE transfer_item.transfer_id = NEW.id
        ON CONFLICT (branch_id, product_id)
        DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity;
        
        -- Set completion date
        NEW.completion_date = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory transfers
CREATE TRIGGER process_inventory_transfer_trigger
BEFORE UPDATE ON inventory_transfers
FOR EACH ROW
EXECUTE FUNCTION process_inventory_transfer();