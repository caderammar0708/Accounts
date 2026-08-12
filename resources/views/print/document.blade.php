<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} {{ $documentNo ?? '' }}</title>
    <link rel="icon" type="image/x-icon" href="{{ isset($company) && $company->logo_url ? $company->logo_url : asset('favicon.ico') }}">
    <script src="https://cdn.tailwindcss.com"></script>
    @php
        $pageSetup = $pageSetup ?? [];
        $pageSize = $pageSetup['size'] ?? 'A4';
        $marginTop = $pageSetup['margin_top'] ?? '0';
        $marginBottom = $pageSetup['margin_bottom'] ?? '0';
        $marginLeft = $pageSetup['margin_left'] ?? '0';
        $marginRight = $pageSetup['margin_right'] ?? '0';
        
        $primaryColor = $primaryColor ?? '#111827';
        $textColor = $textColor ?? '#374151';
    @endphp
    <style>
        :root {
            --primary-color: {{ $primaryColor }};
            --text-color: {{ $textColor }};
        }
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            @page {
                size: {{ $pageSize }};
                margin: 0; /* Removes default browser headers and footers */
            }
            .no-print {
                display: none !important;
            }
            .invoice-box {
                box-shadow: none !important;
                margin: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                /* Note: padding is NOT set to 0 here, so the custom margins apply! */
            }
            .letterhead-img {
                position: fixed !important;
            }
        }
        body {
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            color: var(--text-color);
        }
        .invoice-box {
            width: 210mm;
            min-height: 297mm;
            box-sizing: border-box;
            margin: auto;
            padding: {{ $marginTop ?: '15' }}mm {{ $marginRight ?: '15' }}mm {{ $marginBottom ?: '15' }}mm {{ $marginLeft ?: '15' }}mm;
            background-color: {{ $pageSetup['background_color'] ?? '#fff' }};
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            line-height: 24px;
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: var(--text-color);
        }
        
        /* Custom Colors */
        .text-primary { color: var(--primary-color); }
        .bg-primary { background-color: var(--primary-color); }
        .border-primary { border-color: var(--primary-color); }
        .text-base { color: var(--text-color); }
    </style>
</head>
<body>
    @if(!(isset($isPreview) && $isPreview))
    <div class="max-w-[800px] mx-auto mb-4 flex justify-end no-print">
        <button onclick="window.print()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded shadow">
            Print {{ $title }}
        </button>
    </div>
    @endif

    @php
        $defaultLayout = [
            'header_left' => ['logo', 'company_details'],
            'header_right' => ['title', 'document_info'],
            'body' => ['bill_to', 'shipping_to', 'items_table'],
            'footer_left' => ['static_content'],
            'footer_right' => ['totals'],
        ];
        
        $layout = isset($layoutConfig) && $layoutConfig ? (is_string($layoutConfig) ? json_decode($layoutConfig, true) : $layoutConfig) : $defaultLayout;
        
        $allVars = get_defined_vars();
    @endphp

    @if(isset($printSetting) && $printSetting->html_template)
        @php
            $html = $printSetting->html_template;
            
            // Simple token replacement
            $html = str_replace('{{ invoice_no }}', $documentNo ?? '', $html);
            $html = str_replace('{{ title }}', $title ?? '', $html);
            $html = str_replace('{{ date }}', isset($documentDate) ? $documentDate : date('Y-m-d'), $html);
            // More tokens can be added here
        @endphp
        {!! $html !!}
    @else
    <div class="invoice-box relative z-10" style="position: relative;">
        @if(isset($printSetting) && $printSetting->letterhead_image_path)
            <!-- Absolute on screen (contained), fixed on print (repeats) -->
            <img src="{{ asset('storage/' . $printSetting->letterhead_image_path) }}" 
                 alt="" 
                 class="letterhead-img"
                 style="position: absolute; top: 0; left: 0; width: 100%; z-index: -1;">
        @endif
        <!-- Header Section -->
        <div class="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
            <div class="w-1/2">
                @foreach($layout['header_left'] ?? [] as $blockId)
                    @include('print.block', ['blockId' => $blockId])
                @endforeach
            </div>
            <div class="w-1/2 text-right">
                @foreach($layout['header_right'] ?? [] as $blockId)
                    @include('print.block', ['blockId' => $blockId])
                @endforeach
            </div>
        </div>

        <!-- Body Section -->
        <div>
            @foreach($layout['body'] ?? [] as $blockId)
                @include('print.block', ['blockId' => $blockId])
            @endforeach
        </div>

        <!-- Footer Section -->
        <div class="flex justify-between items-start pt-8">
            <div class="w-1/2 pr-8">
                @foreach($layout['footer_left'] ?? [] as $blockId)
                    @include('print.block', ['blockId' => $blockId])
                @endforeach
            </div>
            <div class="w-1/2 pl-8 flex justify-end">
                <div class="w-full">
                    @foreach($layout['footer_right'] ?? [] as $blockId)
                        @include('print.block', ['blockId' => $blockId])
                    @endforeach
                </div>
            </div>
        </div>
        
    </div>
    @endif

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>
