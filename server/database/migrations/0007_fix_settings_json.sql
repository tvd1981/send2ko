-- Fix any invalid JSON in settings field
UPDATE tlg_users 
SET settings = '{"web": 20, "opds": 20}'
WHERE settings IS NULL 
   OR settings = '{web: 20, opds: 20}'
   OR settings NOT LIKE '{%"web"%:%"opds"%}';
