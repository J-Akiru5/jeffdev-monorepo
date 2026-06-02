-- Migration: Update old prism URL to the new domain across all releases
UPDATE releases 
SET link = 'https://prism.syntaxure.dev/' 
WHERE link = 'https://prism.syntaxure.dev';
