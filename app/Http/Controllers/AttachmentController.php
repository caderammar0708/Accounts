<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Symfony\Component\HttpFoundation\Response;

class AttachmentController extends Controller
{
    /**
     * Store one or more attachments polymorphically.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => [
                'nullable',
                File::types(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'])
                    ->max(10 * 1024), // 10MB in KB
            ],
            'files' => 'nullable|array',
            'files.*' => [
                File::types(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'])
                    ->max(10 * 1024),
            ],
            'attachable_type' => 'nullable|string|max:255',
            'attachable_id' => 'nullable|string|max:255',
        ]);

        $uploadedFiles = [];

        if ($request->hasFile('file')) {
            $uploadedFiles[] = $request->file('file');
        } elseif ($request->hasFile('files')) {
            $uploadedFiles = $request->file('files');
        }

        if (empty($uploadedFiles)) {
            return response()->json([
                'success' => false,
                'message' => 'No files provided for upload.'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $attachableType = $request->input('attachable_type');
        $attachableId = $request->input('attachable_id');

        $createdAttachments = [];

        foreach ($uploadedFiles as $file) {
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
            
            // Store file on public disk inside 'attachments' folder
            $path = $file->store('attachments', 'public');

            $attachment = Attachment::create([
                'attachable_id' => $attachableId ?: null,
                'attachable_type' => $attachableType ?: null,
                'file_path' => $path,
                'file_name' => $originalName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'uploaded_by' => Auth::id(),
            ]);

            $createdAttachments[] = $attachment;
        }

        if (count($createdAttachments) === 1) {
            return response()->json([
                'success' => true,
                'attachment' => $createdAttachments[0],
                'message' => 'File uploaded successfully.'
            ], Response::HTTP_CREATED);
        }

        return response()->json([
            'success' => true,
            'attachments' => $createdAttachments,
            'message' => 'Files uploaded successfully.'
        ], Response::HTTP_CREATED);
    }

    /**
     * Delete an attachment.
     */
    public function destroy(Attachment $attachment)
    {
        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attachment deleted successfully.'
        ]);
    }

    /**
     * Download or view an attachment.
     */
    public function download(Attachment $attachment)
    {
        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File not found in storage.');
        }

        return Storage::disk('public')->download(
            $attachment->file_path,
            $attachment->file_name
        );
    }
}
