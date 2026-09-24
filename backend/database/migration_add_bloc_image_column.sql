-- Add image support for blocs
ALTER TABLE blocs
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL AFTER description;

