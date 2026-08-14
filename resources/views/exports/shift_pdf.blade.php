<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Sales summery - {{ $shift->id }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .header h2 { margin: 0; padding: 0; font-size: 18px; }
        .header h3 { margin: 10px 0 5px 0; font-size: 16px; }
        .header p { margin: 3px 0; font-size: 12px; color: #555; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-grid div { width: 48%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f9f9f9; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row td { font-weight: bold; background-color: #f0f0f0; }
        h4 { margin-bottom: 5px; color: #444; }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #ccc; color: #000; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
    </div>

    @php
        $company = \App\Models\Company::first();
    @endphp

    <div class="header">
        <h2>{{ $company->company_name ?? 'Company Name' }}</h2>
        <p>{{ $company->address ?? 'Address' }}, Tel: {{ $company->phone ?? 'Phone' }}</p>
        
        <h3>Daily Sales summery</h3>
        <p>Date: {{ \Carbon\Carbon::parse($shift->start_time)->format('Y-m-d') }}</p>
    </div>

    <div class="info-grid">
        <div style="float: left; width: 48%;">
            <strong>Employee Details:</strong> {{ $shift->employee?->name }}<br>
            <strong>Manager Details:</strong> M.J.M.Aslam
        </div>
        <div class="text-right" style="float: right; width: 48%;">
            <strong>Start Time:</strong> {{ \Carbon\Carbon::parse($shift->start_time)->format('Y-m-d h:i A') }}<br>
            <strong>End Time:</strong> {{ $shift->end_time ? \Carbon\Carbon::parse($shift->end_time)->format('Y-m-d h:i A') : 'N/A' }}
        </div>
        <div style="clear: both;"></div>
    </div>

    @php
        $fuelTypes = [];
        foreach($shift->shiftNozzles as $sn) {
            $fuelTypeName = $sn->nozzle?->tank?->fuel_type?->name ?? 'Unknown Fuel';
            if (!isset($fuelTypes[$fuelTypeName])) {
                $fuelTypes[$fuelTypeName] = [
                    'nozzles' => [],
                    'total_volume' => 0,
                    'total_value' => 0,
                ];
            }
            $fuelTypes[$fuelTypeName]['nozzles'][] = $sn;
            $fuelTypes[$fuelTypeName]['total_volume'] += $sn->volume_sold;
            $fuelTypes[$fuelTypeName]['total_value'] += $sn->total_value;
        }
    @endphp

    @foreach($fuelTypes as $fuelName => $data)
        <h4>{{ $fuelName }}</h4>
        <table>
            <thead>
                <tr>
                    <th>Nozzle</th>
                    <th class="text-right">Opening Reading (OR)</th>
                    <th class="text-right">Closing Reading (CR)</th>
                    <th class="text-right">Liter</th>
                    <th class="text-right">Sales</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['nozzles'] as $sn)
                <tr>
                    <td>{{ $sn->nozzle?->name }}</td>
                    <td class="text-right">{{ number_format($sn->opening_reading, 2) }}</td>
                    <td class="text-right">{{ number_format($sn->closing_reading, 2) }}</td>
                    <td class="text-right">{{ number_format($sn->volume_sold, 2) }}</td>
                    <td class="text-right">{{ number_format($sn->total_value, 2) }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="3" class="text-right">Total {{ $fuelName }}</td>
                    <td class="text-right">{{ number_format($data['total_volume'], 2) }}</td>
                    <td class="text-right">{{ number_format($data['total_value'], 2) }}</td>
                </tr>
            </tbody>
        </table>
    @endforeach

    <div style="margin-top: 20px; font-weight: bold; text-align: right; font-size: 16px; margin-bottom: 20px;">
        Total Sales: {{ number_format($shift->total_sales_value, 2) }}
    </div>

    <h3>Transactions</h3>
    
    @if($shift->collections->count() > 0)
    <h4>Collections (Cash / Bank)</h4>
    <table>
        <thead>
            <tr>
                <th>Account</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($shift->collections as $col)
            <tr>
                <td>{{ $col->account?->name }}</td>
                <td class="text-right">{{ number_format($col->amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($shift->creditSales->count() > 0)
    <h4>Credit Sales</h4>
    <table>
        <thead>
            <tr>
                <th>Customer</th>
                <th>Description</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($shift->creditSales as $cs)
            <tr>
                <td>{{ $cs->customer?->display_name }}</td>
                <td>{{ $cs->description }}</td>
                <td class="text-right">{{ number_format($cs->amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; text-align: right;">
        @php
            $collected = $shift->collections->sum('amount') + $shift->creditSales->sum('amount');
        @endphp
        <p><strong>Total Sales:</strong> {{ number_format($shift->total_sales_value, 2) }}</p>
        <p><strong>Total Collected:</strong> {{ number_format($collected, 2) }}</p>
        <p style="font-size: 16px; color: {{ $shift->discrepancy < 0 ? '#d9534f' : ($shift->discrepancy > 0 ? '#5cb85c' : '#333') }}">
            <strong>Discrepancy:</strong> 
            {{ $shift->discrepancy > 0 ? '+' : '' }}{{ number_format($shift->discrepancy, 2) }}
        </p>
    </div>
</body>
</html>
