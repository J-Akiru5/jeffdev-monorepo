-- Set file size limit to 50MB for all storage buckets
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE file_size_limit IS DISTINCT FROM 52428800;
