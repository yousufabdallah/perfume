-- Policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Branch managers can view users in their branch" ON users;
CREATE POLICY "Branch managers can view users in their branch"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'branch_manager'
      AND users.branch_id = users.branch_id
    )
  );

DROP POLICY IF EXISTS "General managers can view all users" ON users;
CREATE POLICY "General managers can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

DROP POLICY IF EXISTS "General managers can insert users" ON users;
CREATE POLICY "General managers can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

DROP POLICY IF EXISTS "General managers can update users" ON users;
CREATE POLICY "General managers can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

-- Policies for branches table
DROP POLICY IF EXISTS "All users can view branches" ON branches;
CREATE POLICY "All users can view branches"
  ON branches FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "General managers can insert branches" ON branches;
CREATE POLICY "General managers can insert branches"
  ON branches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

DROP POLICY IF EXISTS "General managers can update branches" ON branches;
CREATE POLICY "General managers can update branches"
  ON branches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

-- Policies for products table
DROP POLICY IF EXISTS "All users can view products" ON products;
CREATE POLICY "All users can view products"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "General managers can insert products" ON products;
CREATE POLICY "General managers can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

DROP POLICY IF EXISTS "General managers can update products" ON products;
CREATE POLICY "General managers can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'general_manager'
    )
  );

-- Policies for inventory table
DROP POLICY IF EXISTS "All users can view inventory" ON inventory;
CREATE POLICY "All users can view inventory"
  ON inventory FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Branch managers can update their branch inventory" ON inventory;
CREATE POLICY "Branch managers can update their branch inventory"
  ON inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('branch_manager', 'general_manager')
      AND (users.branch_id = inventory.branch_id OR users.role = 'general_manager')
    )
  );

DROP POLICY IF EXISTS "Branch managers can insert their branch inventory" ON inventory;
CREATE POLICY "Branch managers can insert their branch inventory"
  ON inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('branch_manager', 'general_manager')
      AND (users.branch_id = inventory.branch_id OR users.role = 'general_manager')
    )
  );

-- Policies for financial transactions
DROP POLICY IF EXISTS "Users can view financial transactions in their branch" ON financial_transactions;
CREATE POLICY "Users can view financial transactions in their branch"
  ON financial_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.branch_id = financial_transactions.branch_id OR users.role = 'general_manager')
    )
  );

DROP POLICY IF EXISTS "Accountants can insert financial transactions" ON financial_transactions;
CREATE POLICY "Accountants can insert financial transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('accountant', 'branch_manager', 'general_manager')
      AND (users.branch_id = financial_transactions.branch_id OR users.role = 'general_manager')
    )
  );

-- Policies for inventory transfers
DROP POLICY IF EXISTS "Users can view inventory transfers for their branch" ON inventory_transfers;
CREATE POLICY "Users can view inventory transfers for their branch"
  ON inventory_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.branch_id = inventory_transfers.from_branch_id OR 
           users.branch_id = inventory_transfers.to_branch_id OR 
           users.role = 'general_manager')
    )
  );

DROP POLICY IF EXISTS "Branch managers can create inventory transfers" ON inventory_transfers;
CREATE POLICY "Branch managers can create inventory transfers"
  ON inventory_transfers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('branch_manager', 'general_manager')
      AND (users.branch_id = inventory_transfers.from_branch_id OR users.role = 'general_manager')
    )
  );

DROP POLICY IF EXISTS "Branch managers can update inventory transfers" ON inventory_transfers;
CREATE POLICY "Branch managers can update inventory transfers"
  ON inventory_transfers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('branch_manager', 'general_manager')
      AND (users.branch_id = inventory_transfers.to_branch_id OR users.role = 'general_manager')
    )
  );

-- Policies for inventory transfer items
DROP POLICY IF EXISTS "Users can view inventory transfer items" ON inventory_transfer_items;
CREATE POLICY "Users can view inventory transfer items"
  ON inventory_transfer_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventory_transfers
      JOIN users ON users.id = auth.uid()
      WHERE inventory_transfer_items.transfer_id = inventory_transfers.id
      AND (users.branch_id = inventory_transfers.from_branch_id OR 
           users.branch_id = inventory_transfers.to_branch_id OR 
           users.role = 'general_manager')
    )
  );

DROP POLICY IF EXISTS "Branch managers can insert inventory transfer items" ON inventory_transfer_items;
CREATE POLICY "Branch managers can insert inventory transfer items"
  ON inventory_transfer_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_transfers
      JOIN users ON users.id = auth.uid()
      WHERE inventory_transfer_items.transfer_id = inventory_transfers.id
      AND users.role IN ('branch_manager', 'general_manager')
      AND (users.branch_id = inventory_transfers.from_branch_id OR users.role = 'general_manager')
    )
  );