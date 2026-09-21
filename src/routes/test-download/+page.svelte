<script lang="ts">
    let downloading = $state(false);
    let availableOffline = $state(false);

    async function saveOffline(){
        downloading = true;
        try{
            const registration = await navigator.serviceWorker.ready;
            const worker = registration.active;

            worker?.postMessage({
                type: 'CACHE_PAGE',
                urls: [
                    '/test-one.jpg',
                    '/test-two.jpg',
                    '/test-three.jpg',
                ]
            });

            availableOffline = true;
        }catch(error){
            console.error('Error caching page', error)
        }finally{
            downloading = false;
        }
    }
</script>

<div class="flex flex-col gap-6 p-8">
	<div class="grid grid-cols-2 gap-4">
		<img src="/test-one.jpg" alt="" />
		<img src="/test-two.jpg" alt="" />
		<img src="/test-three.jpg" alt="" />
	</div>
    <button onclick={saveOffline} disabled={downloading || availableOffline}>
        {#if downloading}
		Saving...
	{:else if availableOffline}
		Available offline
	{:else}
		Make available offline
	{/if}
    </button>
   </div>
