<script lang="ts">
  import { onMount } from 'svelte';
  
  export let wsClient: any;
  let isConnected = false;
  
  onMount(() => {
    const checkConnection = () => {
      isConnected = wsClient?.isConnected() || false;
    };
    
    // Check connection status every few seconds
    const interval = setInterval(checkConnection, 3000);
    checkConnection();
    
    return () => clearInterval(interval);
  });
</script>

<div class="connection-status">
  {#if isConnected}
    <span class="text-green-500 text-xs">● Connected</span>
  {:else}
    <span class="text-red-500 text-xs">● Disconnected</span>
  {/if}
</div>

<style>
  .connection-status {
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    padding: 4px 8px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
</style>
