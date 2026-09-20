-- Finalized journals are append-only. Corrections must be posted as a new
-- reversing transaction, never by altering the original financial evidence.
CREATE OR REPLACE FUNCTION reject_finalized_ledger_entry_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM ledger_transactions WHERE id=OLD.transaction_id AND status='FINALIZED') THEN
    RAISE EXCEPTION 'Finalized ledger entries are immutable; create a reversing transaction instead';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_entries_immutable_when_finalized ON ledger_entries;
CREATE TRIGGER ledger_entries_immutable_when_finalized
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION reject_finalized_ledger_entry_mutation();

CREATE OR REPLACE FUNCTION reject_finalized_ledger_transaction_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status='FINALIZED' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.payment_id IS DISTINCT FROM OLD.payment_id OR NEW.reference_id IS DISTINCT FROM OLD.reference_id) THEN
    RAISE EXCEPTION 'Finalized ledger transaction is immutable; create a reversing transaction instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_transactions_immutable_when_finalized ON ledger_transactions;
CREATE TRIGGER ledger_transactions_immutable_when_finalized
BEFORE UPDATE ON ledger_transactions
FOR EACH ROW EXECUTE FUNCTION reject_finalized_ledger_transaction_mutation();
