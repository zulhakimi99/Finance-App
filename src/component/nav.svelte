<script>
    import router, { curRoute } from '../router.js';
    import RouterLink from '../RouterLink.svelte';
    import { onMount } from 'svelte';

</script>

<style>
    body {
 margin: 0;
 font-family: Arial, Helvetica, sans-serif;
}

.topnav {
 overflow: hidden;
 padding: 10px;
 background-color: salmon;
}
</style>

<body>
    <div class="topnav">
        <RouterLink page= {{path: '/', name: 'Home'}} />
        <RouterLink page= {{path: '/about', name: 'About'}} />
    </div>

    <div id="pageContent">
        <svelte:component this={router[$curRoute]} />
    </div>
</body>