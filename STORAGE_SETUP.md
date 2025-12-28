# Supabase Storage Setup

## Overview
This application uses Supabase Storage to store business logos and other images. The images are uploaded to a storage bucket and their public URLs are saved to the database.

## Required Storage Bucket Configuration

### 1. Create Storage Bucket

In your Supabase Dashboard:
1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Set the following:
   - **Name**: `business-images`
   - **Public bucket**: ✅ **YES** (images need to be publicly accessible)
   - **File size limit**: 5MB (recommended)
   - **Allowed MIME types**: `image/*`

### 2. Storage Policies

The bucket needs to allow:
- **Public READ** access (so anyone can view images via public URLs)
- **Authenticated INSERT** (so logged-in business owners can upload)
- **Authenticated UPDATE** (so business owners can replace their images)
- **Authenticated DELETE** (so business owners can remove their images)

#### Policy SQL

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Policy: Allow public to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-images');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-images');

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-images');

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-images');
```

### 3. Verify Setup

After creating the bucket and policies:

1. Test upload in the app:
   - Log in to your business admin panel
   - Go to Brand Management
   - Upload a logo image
   - Click "Guardar Cambios"
   - The image should persist after page refresh

2. Check in Supabase Dashboard:
   - Go to Storage → business-images
   - You should see folders named after business IDs
   - Inside each folder, you'll see uploaded images with names like `logo-1234567890.jpg`

## How Image Upload Works

1. User selects an image in the BrandManagement component
2. Image is previewed locally using `URL.createObjectURL()`
3. When user clicks "Guardar Cambios":
   - The image file is uploaded to Supabase Storage via `uploadImage()` function
   - Supabase returns a public URL for the uploaded image
   - The public URL is saved to the `businesses.logo_url` database column
   - The business state is updated with the new logo_url

4. The image is displayed using the public URL from `business.logo_url`

## File Organization

Images are organized by business:
```
business-images/
├── vanshelatto/
│   ├── logo-1735123456789.jpg
│   └── logo-1735234567890.png
├── via-cosenza/
│   └── logo-1735345678901.jpg
└── other-business-id/
    └── logo-1735456789012.jpg
```

## Troubleshooting

### Images not uploading
- Check that the `business-images` bucket exists
- Verify the bucket is set to **Public**
- Confirm storage policies are in place

### Images not displaying
- Check browser console for CORS errors
- Verify the `logo_url` field in the database contains a valid URL
- Test the URL directly in a browser

### "Permission denied" errors
- Ensure user is authenticated (logged in)
- Check that INSERT policy allows authenticated users
- Verify the bucket name matches exactly: `business-images`

## Code References

- Image upload function: `/restaurant-qr/src/lib/supabaseService.js` (lines 747-797)
- BrandManagement component: `/restaurant-qr/src/App.jsx` (lines 1090-1235)
- Image display: Multiple locations using `business.logo_url`
