/*
  # Add definition field to workflows table

  1. Changes
    - Add `definition` column to `workflows` table to store BPMN XML data
    - The column is text type and nullable (NULL by default for existing records)
  
  2. Notes
    - This field will store the complete BPMN XML definition for the workflow
    - Existing workflows will have NULL definition until they are edited and saved
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflows' AND column_name = 'definition'
  ) THEN
    ALTER TABLE workflows ADD COLUMN definition text;
  END IF;
END $$;
