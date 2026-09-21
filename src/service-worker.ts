// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Ensures that the `$service-worker` import has proper type definitions
/// <reference types="@sveltejs/kit" />

// Only necessary if you have an import from `$env/static/public`
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { build, files, version } from '$service-worker';

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

const OFFLINE_PAGE_ASSETS = [
	'/offline',
	'/offline/test-img-1.jpg',
	'/offline/test-img-2.jpg',
	'/offline/test-img-3.jpg',
	'/offline/test-img-4.jpg',
	'/offline/test-img-5.jpg',
	'/offline/test-img-6.jpg'
];

const ASSETS = [...build, ...OFFLINE_PAGE_ASSETS];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCache() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCache());
});

self.addEventListener('message', (event) => {
	if (event.data?.type !== 'CACHE_PAGE') return;

	const urls: string[] = event.data.urls;
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(urls);
	}
	event.waitUntil(addFilesToCache());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200 && !response.headers.get('cache-control')?.includes('no-store')) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}
	event.respondWith(respond());
});
