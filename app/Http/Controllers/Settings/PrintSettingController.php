<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PrintSetting;
use Illuminate\Support\Facades\Storage;

class PrintSettingController extends Controller
{
    public function getTemplates(Request $request)
    {
        $type = $request->query('document_type');
        if (!$type) return response()->json([]);
        return response()->json(PrintSetting::where('document_type', $type)->select('id', 'template_name', 'is_default')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_type' => 'required|string',
            'template_name' => 'required|string',
            'is_default' => 'boolean',
            'static_footer_content' => 'nullable|string',
            'html_template' => 'nullable|string',
            'page_setup' => 'nullable|array',
            'letterhead_image' => 'nullable|image|max:2048',
            'primary_color' => 'nullable|string',
            'text_color' => 'nullable|string'
        ]);

        $company = \App\Models\Company::current();
        $companyId = $company ? $company->id : null;

        if ($validated['is_default'] ?? false) {
            PrintSetting::where('company_id', $companyId)
                ->where('document_type', $validated['document_type'])
                ->update(['is_default' => false]);
        }

        $letterheadPath = null;
        if ($request->hasFile('letterhead_image')) {
            $letterheadPath = $request->file('letterhead_image')->store($companyId . '/print_settings', 'public');
        }

        PrintSetting::create([
            'company_id' => $companyId,
            'document_type' => $validated['document_type'],
            'template_name' => $validated['template_name'],
            'is_default' => $validated['is_default'] ?? false,
            'static_footer_content' => $validated['static_footer_content'] ?? null,
            'html_template' => $validated['html_template'] ?? null,
            'primary_color' => $validated['primary_color'] ?? '#111827',
            'text_color' => $validated['text_color'] ?? '#374151',
            'page_setup' => $validated['page_setup'] ?? ['size' => 'A4'],
            'letterhead_image_path' => $letterheadPath,
        ]);

        return redirect()->back()->with('success', 'Print template created successfully.');
    }

    public function update(Request $request, PrintSetting $printSetting)
    {
        $validated = $request->validate([
            'template_name' => 'required|string',
            'is_default' => 'boolean',
            'static_footer_content' => 'nullable|string',
            'html_template' => 'nullable|string',
            'page_setup' => 'nullable|array',
            'letterhead_image' => 'nullable|image|max:2048',
            'primary_color' => 'nullable|string',
            'text_color' => 'nullable|string'
        ]);

        if ($validated['is_default'] ?? false) {
            PrintSetting::where('company_id', $printSetting->company_id)
                ->where('document_type', $printSetting->document_type)
                ->where('id', '!=', $printSetting->id)
                ->update(['is_default' => false]);
        }

        $updateData = [
            'template_name' => $validated['template_name'],
            'is_default' => $validated['is_default'] ?? false,
            'static_footer_content' => $validated['static_footer_content'] ?? null,
            'html_template' => $validated['html_template'] ?? null,
            'primary_color' => $validated['primary_color'] ?? '#111827',
            'text_color' => $validated['text_color'] ?? '#374151',
            'page_setup' => $validated['page_setup'] ?? ['size' => 'A4'],
        ];

        if ($request->hasFile('letterhead_image')) {
            if ($printSetting->letterhead_image_path) {
                Storage::disk('public')->delete($printSetting->letterhead_image_path);
            }
            $updateData['letterhead_image_path'] = $request->file('letterhead_image')->store($printSetting->company_id . '/print_settings', 'public');
        }

        $printSetting->update($updateData);

        return redirect()->back()->with('success', 'Print template updated successfully.');
    }

    public function destroy(PrintSetting $printSetting)
    {
        if ($printSetting->letterhead_image_path) {
            Storage::disk('public')->delete($printSetting->letterhead_image_path);
        }
        $printSetting->delete();

        return redirect()->back()->with('success', 'Print template deleted successfully.');
    }
}
