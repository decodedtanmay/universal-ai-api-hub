<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Configure AI-powered API endpoints: inputs, provider, model, prompt and output schema. Generated docs, playground and usage statistics.">
    <meta name="theme-color" content="#0a0e13" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#f6f7f9" media="(prefers-color-scheme: light)">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <title inertia>{{ config('app.name') }}</title>
    <script>
        try {
            const theme = localStorage.getItem('theme');
            if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
        } catch (e) {}
    </script>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=geist:400,500,600,700|geist-mono:400,500,600|instrument-serif:400,400i&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
