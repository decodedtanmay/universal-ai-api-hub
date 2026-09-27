import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import { PersistentChrome } from './components/PersistentChrome';

createInertiaApp({
    resolve: async (name) => {
        const pages = import.meta.glob<{ default: ComponentType }>(`./pages/**/*.tsx`);
        const page = await pages[`./pages/${name}.tsx`]!();

        return page.default;
    },
    setup({ el, App, props }) {
        if (!el) return;
        createRoot(el).render(<App {...props} />);

        const chrome = document.createElement('div');
        chrome.id = 'chrome';
        document.body.prepend(chrome);
        createRoot(chrome).render(<PersistentChrome />);
    },
    progress: { color: '#6d28d9' },
});
