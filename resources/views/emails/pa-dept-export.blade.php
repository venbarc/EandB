<x-mail::message>
# PA Department Daily Export

The automated PA Department export for **{{ $date }}** is attached.

**Records exported:** {{ $recordCount }}

This is an automated report. Please do not reply to this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
