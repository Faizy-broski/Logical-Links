ALTER TABLE notes
ADD CONSTRAINT fk_notes_created_by
FOREIGN KEY (created_by)
REFERENCES profiles(id);