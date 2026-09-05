-- feedback-screenshots is a public-insert bucket (anyone with the anon
-- key can upload — see schema.sql's comment on it) with no size or
-- content-type limit at the bucket level. The app itself always uploads
-- image/jpeg (lib/feedback.ts's uploadScreenshot), but nothing stopped a
-- caller going around the app and uploading arbitrary large files or
-- non-image content (e.g. an HTML/SVG file with embedded script) directly
-- to Supabase's Storage API with the same anon key — free file hosting
-- disguised as "screenshots", or a way to run up storage costs.
update storage.buckets
set file_size_limit = 5242880, -- 5 MB — generous for a device screenshot
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'feedback-screenshots';
