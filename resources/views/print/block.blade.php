@php
    $styles = isset($blockStyles) && is_array($blockStyles) && array_key_exists($blockId, $blockStyles) ? $blockStyles[$blockId] : [];
    
    $fontSize = isset($styles['fontSize']) && $styles['fontSize'] ? "font-size: {$styles['fontSize']}px;" : "";
    $fontWeight = isset($styles['bold']) && $styles['bold'] ? "font-weight: bold !important;" : "";
    $fontStyle = isset($styles['italic']) && $styles['italic'] ? "font-style: italic !important;" : "";
    $textDecoration = isset($styles['underline']) && $styles['underline'] ? "text-decoration: underline !important;" : "";
    $customColor = isset($styles['color']) && $styles['color'] ? "color: {$styles['color']} !important;" : "";
    $textAlign = isset($styles['textAlign']) && $styles['textAlign'] ? "text-align: {$styles['textAlign']} !important;" : "";
    $inlineStyle = trim("$fontSize $fontWeight $fontStyle $textDecoration $customColor $textAlign");
    $styleAttr = $inlineStyle ? 'style="' . $inlineStyle . '"' : '';

    $logoHeight = isset($styles['logoHeight']) && $styles['logoHeight'] ? "max-height: {$styles['logoHeight']}px !important;" : "max-height: 64px;";

    // Advanced Table Styles
    $headingFontSize = isset($styles['headingFontSize']) && $styles['headingFontSize'] ? "font-size: {$styles['headingFontSize']}px !important;" : "";
    $rowFontSize = isset($styles['rowFontSize']) && $styles['rowFontSize'] ? "font-size: {$styles['rowFontSize']}px !important;" : "";

    // Advanced Party Styles (Bill To / Ship To)
    $titleFontSize = isset($styles['titleFontSize']) && $styles['titleFontSize'] ? "font-size: {$styles['titleFontSize']}px !important;" : "";
    $nameFontSize = isset($styles['nameFontSize']) && $styles['nameFontSize'] ? "font-size: {$styles['nameFontSize']}px !important;" : "";

    $currency = $company->home_currency_prefix ?? '';
@endphp

@switch($blockId)
    @case('logo')
        <div style="{{ $textAlign }} width: 100%;">
        @if(isset($company) && $company->logo_url)
            <img src="{{ $company->logo_url }}" alt="Company Logo" class="mb-4" style="{{ $logoHeight }} display: inline-block;">
        @endif
        </div>
        @break

    @case('company_name')
        @if(isset($company))
            <h2 class="text-2xl font-bold text-base uppercase tracking-wider mb-2" {!! $styleAttr !!}>{{ $company->company_name }}</h2>
        @endif
        @break

    @case('company_details')
        <div class="text-base text-sm" {!! $styleAttr !!}>
            @if(isset($company))
                {!! nl2br(e($company->address ?? '')) !!}<br>
                @if($company->company_email) {{ $company->company_email }} <br> @endif
                @if($company->phone) {{ $company->phone }} @endif
            @endif
        </div>
        @break

    @case('title')
        <h1 class="text-xl font-bold text-primary uppercase tracking-widest mb-4" {!! $styleAttr !!}>{{ $title }}</h1>
        @break

    @case('document_info')
        <div class="text-sm text-base" {!! $styleAttr !!}>
            @if(isset($documentNo))
            <p class="mb-1"><span class="font-semibold text-primary opacity-80">No:</span> <span class="text-primary font-bold">#{{ $documentNo }}</span></p>
            @endif
            @if(isset($date))
            <p class="mb-1"><span class="font-semibold text-primary opacity-80">Date:</span> <span class="text-primary font-bold">{{ \Carbon\Carbon::parse($date)->format('M d, Y') }}</span></p>
            @endif
            @if(isset($dueDate) && $dueDate)
            <p class="mb-1"><span class="font-semibold text-primary opacity-80">Due Date:</span> <span class="text-primary font-bold">{{ \Carbon\Carbon::parse($dueDate)->format('M d, Y') }}</span></p>
            @endif
        </div>
        @break

    @case('bill_to')
        @if(isset($partyName) && $partyName)
        <div class="mb-4" {!! $styleAttr !!}>
            <h3 class="text-xs font-bold text-primary opacity-60 uppercase tracking-wider mb-2" style="{{ $titleFontSize }}">
                {{ $partyLabel ?? 'Bill To' }}
            </h3>
            @if(isset($partyPrefix) && $partyPrefix)
            <div class="text-gray-600 text-sm mb-1">{{ $partyPrefix }}</div>
            @endif
            <div class="text-primary font-semibold text-lg" style="{{ $nameFontSize }}">
                {!! nl2br(e($partyName ?? '')) !!}
            </div>
            <div class="text-base text-sm mt-1">
                {!! nl2br(e($partyAddress ?? '')) !!}
                @if(isset($partyEmail) && $partyEmail) <br>{{ $partyEmail }} @endif
            </div>
        </div>
        @endif
        @break

    @case('shipping_to')
        @if(isset($shippingAddress) && $shippingAddress)
        <div class="mb-4" {!! $styleAttr !!}>
            <h3 class="text-xs font-bold text-primary opacity-60 uppercase tracking-wider mb-2" style="{{ $titleFontSize }}">
                Ship To
            </h3>
            <div class="text-base text-sm mt-1">
                {!! nl2br(e($shippingAddress ?? '')) !!}
            </div>
        </div>
        @endif
        @break

    @case('items_table')
        @if(isset($tableItems) && count($tableItems) > 0)
        <table class="w-full text-left border-collapse mb-4 text-base" {!! $styleAttr !!}>
            <thead>
                <tr class="border-b-2 border-primary bg-slate-50">
                    @foreach($tableHeaders as $index => $header)
                        <th class="py-2 px-2 font-bold text-primary {{ $index === 0 ? 'w-1/2' : 'text-right' }}" style="{{ $headingFontSize }}">{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($tableItems as $row)
                <tr class="border-b border-gray-200" style="{{ $rowFontSize }}">
                    @foreach($row as $index => $cell)
                        <td class="py-2 px-2 {{ $index === 0 ? '' : 'text-right' }} {!! $index === count($row) - 1 ? 'font-semibold text-primary' : 'text-base' !!}">
                            {!! $cell !!}
                        </td>
                    @endforeach
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
        @break

    @case('totals')
        <div class="border-t-2 border-primary mt-2 min-w-[250px]" {!! $styleAttr !!}>
            @if(isset($summaryInfo) && is_array($summaryInfo))
                @foreach($summaryInfo as $label => $value)
                    <div class="flex justify-between py-2 {{ $loop->last || $label === 'Balance Due' ? 'font-bold text-xl text-primary border-t border-gray-200 mt-2' : 'text-base text-gray-600' }}">
                        <span>{{ $label }}</span>
                        <span>{{ $value }}</span>
                    </div>
                @endforeach
            @else
                <div class="flex justify-between py-2 font-bold text-xl text-primary">
                    <span>Total</span>
                    <span>{{ $currency }}{{ number_format($totalAmount ?? 0, 2) }}</span>
                </div>
                @if(isset($balanceDue))
                <div class="flex justify-between py-2 text-base border-t border-gray-200">
                    <span>Balance Due</span>
                    <span class="font-semibold text-primary">{{ $currency }}{{ number_format($balanceDue, 2) }}</span>
                </div>
                @endif
            @endif

            @if(isset($paymentsTable) && count($paymentsTable) > 0)
            <div class="mt-6 border-t border-gray-200 pt-4">
                <h4 class="text-xs font-bold text-primary opacity-80 uppercase tracking-wider mb-2">Payments Received</h4>
                <table class="w-full text-sm text-left">
                    <tbody>
                        @foreach($paymentsTable as $payment)
                        <tr class="border-b border-gray-100 last:border-0">
                            <td class="py-2 text-gray-500">{{ \Carbon\Carbon::parse($payment['date'])->format('M d, Y') }}</td>
                            <td class="py-2 text-gray-700">{{ $payment['desc'] }}</td>
                            <td class="py-2 text-right font-medium">{{ $payment['amount'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @endif
        </div>
        @break

    @case('static_content')
        <div {!! $styleAttr !!}>
            @if(isset($statementMessage) && $statementMessage)
                <div class="mb-4">
                    <h4 class="text-xs font-bold text-primary opacity-70 uppercase tracking-wider mb-1">Statement Message</h4>
                    <p class="text-sm text-base">{{ $statementMessage }}</p>
                </div>
            @endif

            @if(isset($staticFooterContent) && $staticFooterContent)
            <div class="mt-8 pt-6 border-t border-gray-200">
                <div class="text-sm text-base prose max-w-none">
                    {!! nl2br(e($staticFooterContent)) !!}
                </div>
            </div>
            @endif
        </div>
        @break
@endswitch
