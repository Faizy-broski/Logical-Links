-- =============================================================================
-- Migration 022: RLS Policies for Quotations & Invoices
--
-- Admins: full access to all records (service-role key bypasses RLS on backend)
-- Shippers: access only their own account's documents (via profile_id)
-- =============================================================================

-- ── quotations ────────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_quotations" ON quotations
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_quotations" ON quotations
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND profile_id IN (
      SELECT id FROM profiles WHERE account_id = current_account_id()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "shipper_create_quotation" ON quotations
  FOR INSERT WITH CHECK (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
  );

CREATE POLICY "shipper_update_own_quotation" ON quotations
  FOR UPDATE USING (
    current_user_role() = 'shipper'
    AND profile_id IN (
      SELECT id FROM profiles WHERE account_id = current_account_id()
    )
    AND status = 'draft'
    AND deleted_at IS NULL
  );

-- ── quotation_items ───────────────────────────────────────────────────────────

CREATE POLICY "admin_all_quotation_items" ON quotation_items
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_quotation_items" ON quotation_items
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND quotation_id IN (
      SELECT id FROM quotations
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE account_id = current_account_id()
      )
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "shipper_manage_own_quotation_items" ON quotation_items
  FOR ALL USING (
    current_user_role() = 'shipper'
    AND quotation_id IN (
      SELECT id FROM quotations
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE account_id = current_account_id()
      )
      AND status = 'draft'
    )
  );

-- ── invoices ──────────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_invoices" ON invoices
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_invoices" ON invoices
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND profile_id IN (
      SELECT id FROM profiles WHERE account_id = current_account_id()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "shipper_create_invoice" ON invoices
  FOR INSERT WITH CHECK (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
  );

CREATE POLICY "shipper_update_own_invoice" ON invoices
  FOR UPDATE USING (
    current_user_role() = 'shipper'
    AND profile_id IN (
      SELECT id FROM profiles WHERE account_id = current_account_id()
    )
    AND status = 'draft'
    AND deleted_at IS NULL
  );

-- ── invoice_items ─────────────────────────────────────────────────────────────

CREATE POLICY "admin_all_invoice_items" ON invoice_items
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_invoice_items" ON invoice_items
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND invoice_id IN (
      SELECT id FROM invoices
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE account_id = current_account_id()
      )
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "shipper_manage_own_invoice_items" ON invoice_items
  FOR ALL USING (
    current_user_role() = 'shipper'
    AND invoice_id IN (
      SELECT id FROM invoices
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE account_id = current_account_id()
      )
      AND status = 'draft'
    )
  );
